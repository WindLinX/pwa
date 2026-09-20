import { db } from '@/db/database'
import type { Category, RecordType } from '@/types'
export const categoryService = {
  list(type?: RecordType) { const q = type ? db.categories.where('type').equals(type) : db.categories.toCollection(); return q.sortBy('sort') },
  get(id: number) { return db.categories.get(id) },
  async save(category: Omit<Category, 'id' | 'createdAt'> & { id?: number }) { if (category.parentId) { const parent = await db.categories.get(category.parentId); if (!parent || parent.type !== category.type || parent.parentId || parent.id === category.id) throw new Error('请选择同一收支类型的一级分类。') }; if (category.id) { await db.categories.update(category.id, category); return category.id }; return db.categories.add({ ...category, createdAt: Date.now() }) },
  async remove(id: number) { const [used, children] = await Promise.all([db.records.where('categoryId').equals(id).count(), db.categories.where('parentId').equals(id).count()]); if (used) throw new Error('该分类已有账单使用，无法删除。请先编辑或删除相关账单。'); if (children) throw new Error('该一级分类下还有子分类，无法删除。请先删除子分类。'); await db.categories.delete(id) },
  async reorder(categories: Category[]) { await db.transaction('rw', db.categories, async () => { await Promise.all(categories.map((c, sort) => db.categories.update(c.id!, { sort }))) }) }
}
