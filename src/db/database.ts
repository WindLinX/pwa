import Dexie, { type EntityTable } from 'dexie'
import type { AppSetting, Category, DailyExpense, RecordItem } from '@/types'
import { expenseDefaults, incomeDefaults } from './defaultCategories'

class MoneyDatabase extends Dexie {
  records!: EntityTable<RecordItem, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<AppSetting, 'key'>
  dailyExpenses!: EntityTable<DailyExpense, 'date'>
  constructor() {
    super('pocket-ledger')
    this.version(1).stores({ records: '++id, type, categoryId, date, [date+type], [date+categoryId], createdAt', categories: '++id, [type+sort], type, sort', settings: 'key' })
    this.version(2).stores({ records: '++id, type, categoryId, date, [date+type], [date+categoryId], createdAt', categories: '++id, [type+sort], type, sort', settings: 'key', dailyExpenses: 'date' }).upgrade(async transaction => {
      const records = await transaction.table('records').toArray() as RecordItem[]
      const totals = new Map<string, number>()
      records.filter(record => record.type === 'expense').forEach(record => totals.set(record.date, (totals.get(record.date) ?? 0) + record.amount))
      await transaction.table('dailyExpenses').bulkPut([...totals].map(([date, amount]) => ({ date, amount })))
    })
    this.version(3).stores({ records: '++id, type, categoryId, date, [date+type], [date+categoryId], createdAt', categories: '++id, [type+sort], [parentId+sort], type, parentId, sort', settings: 'key', dailyExpenses: 'date' }).upgrade(async transaction => {
      const categories = transaction.table('categories')
      const now = Date.now()
      const defaults: Record<string, string[]> = { 交通: ['打车', '地铁'], 餐饮: ['早餐', '午餐', '晚餐', '夜宵', '奶茶酒饮'] }
      for (const [name, children] of Object.entries(defaults)) {
        const parent = await categories.toCollection().filter((category: Category) => category.name === name && category.type === 'expense' && !category.parentId).first() as Category | undefined
        if (!parent?.id) continue
        const existing = await categories.where('parentId').equals(parent.id).toArray() as Category[]
        await categories.bulkAdd(children.filter(child => !existing.some(category => category.name === child)).map((child, sort) => ({ name: child, icon: parent.icon, type: 'expense' as const, parentId: parent.id, sort, createdAt: now })))
      }
    })
    this.version(4).stores({ records: '++id, type, categoryId, date, [date+type], [date+categoryId], createdAt', categories: '++id, [type+sort], [parentId+sort], type, parentId, sort', settings: 'key', dailyExpenses: 'date' }).upgrade(async transaction => {
      const categories = transaction.table('categories')
      const records = transaction.table('records')
      const now = Date.now()
      for (const [sort, definition] of expenseDefaults.entries()) {
        let parent = await categories.toCollection().filter((category: Category) => category.type === 'expense' && !category.parentId && category.name === definition.name).first() as Category | undefined
        if (!parent?.id) {
          const id = await categories.add({ name: definition.name, icon: definition.icon, type: 'expense', sort, createdAt: now }) as number
          parent = await categories.get(id) as Category
        }
        const children = await categories.where('parentId').equals(parent.id!).toArray() as Category[]
        for (const child of children) {
          if (!definition.children.some(definitionChild => definitionChild.name === child.name) && !(await records.where('categoryId').equals(child.id!).count())) await categories.delete(child.id!)
        }
        const currentChildren = await categories.where('parentId').equals(parent.id!).toArray() as Category[]
        await categories.bulkAdd(definition.children.filter(definitionChild => !currentChildren.some(child => child.name === definitionChild.name)).map(({ name, icon }, childSort): Category => ({ name, icon, type: 'expense', parentId: parent!.id, sort: childSort, createdAt: now })))
      }
      const allowed = new Set<string>(expenseDefaults.map(definition => definition.name))
      const roots = await categories.toCollection().filter((category: Category) => category.type === 'expense' && !category.parentId && !allowed.has(category.name)).toArray() as Category[]
      for (const root of roots) {
        const children = await categories.where('parentId').equals(root.id!).toArray() as Category[]
        if ((await records.where('categoryId').equals(root.id!).count()) || (await Promise.all(children.map(child => records.where('categoryId').equals(child.id!).count()))).some(Boolean)) continue
        await categories.bulkDelete(children.map(child => child.id!))
        await categories.delete(root.id!)
      }
    })
    this.version(5).stores({ records: '++id, type, categoryId, date, [date+type], [date+categoryId], createdAt', categories: '++id, [type+sort], [parentId+sort], type, parentId, sort', settings: 'key', dailyExpenses: 'date' }).upgrade(async transaction => {
      const categories = transaction.table('categories')
      const records = transaction.table('records')
      for (const [sort, definition] of incomeDefaults.entries()) {
        const current = await categories.toCollection().filter((category: Category) => category.type === 'income' && !category.parentId && category.name === definition.name).first() as Category | undefined
        if (!current) await categories.add({ name: definition.name, icon: definition.icon, type: 'income', sort, createdAt: Date.now() })
      }
      const allowed = new Set<string>(incomeDefaults.map(definition => definition.name))
      const roots = await categories.toCollection().filter((category: Category) => category.type === 'income' && !category.parentId && !allowed.has(category.name)).toArray() as Category[]
      for (const root of roots) if (!(await records.where('categoryId').equals(root.id!).count())) await categories.delete(root.id!)
    })
    this.version(6).stores({ records: '++id, type, categoryId, date, [date+type], [date+categoryId], createdAt', categories: '++id, [type+sort], [parentId+sort], type, parentId, sort', settings: 'key', dailyExpenses: 'date' }).upgrade(async transaction => {
      const categories = transaction.table('categories')
      const records = transaction.table('records')
      const legacyChildren: Record<string, string[]> = { 餐饮: ['早', '中', '晚', '酒水饮料', '零食', '奶茶酒饮'], 医疗: ['生病', '复查'] }
      for (const definition of expenseDefaults) {
        const parent = await categories.toCollection().filter((category: Category) => category.type === 'expense' && !category.parentId && category.name === definition.name).first() as Category | undefined
        if (!parent?.id) continue
        await categories.update(parent.id, { icon: definition.icon })
        const currentChildren = await categories.where('parentId').equals(parent.id).toArray() as Category[]
        for (const child of currentChildren) {
          if (legacyChildren[definition.name]?.includes(child.name) && !(await records.where('categoryId').equals(child.id!).count())) await categories.delete(child.id!)
        }
        const remainingChildren = await categories.where('parentId').equals(parent.id).toArray() as Category[]
        for (const [sort, childDefinition] of definition.children.entries()) {
          const current = remainingChildren.find(child => child.name === childDefinition.name)
          if (current?.id) await categories.update(current.id, { icon: childDefinition.icon, sort })
          else await categories.add({ name: childDefinition.name, icon: childDefinition.icon, type: 'expense', parentId: parent.id, sort, createdAt: Date.now() })
        }
      }
    })
  }
}
export const db = new MoneyDatabase()
