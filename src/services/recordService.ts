import { db } from '@/db/database'
import type { MonthSummary, RecordItem, RecordType } from '@/types'
import { monthRange } from '@/utils/date'
export interface RecordFilters { month: string; type?: RecordType; categoryId?: number; keyword?: string }
async function syncDailyExpense(date: string) { const rows = await db.records.where('[date+type]').equals([date, 'expense']).toArray(); const amount = rows.reduce((sum, record) => sum + record.amount, 0); if (amount) await db.dailyExpenses.put({ date, amount }); else await db.dailyExpenses.delete(date) }
export const recordService = {
  async listAll(): Promise<RecordItem[]> { return db.records.orderBy('date').reverse().sortBy('date').then(rows => rows.reverse()) },
  async list(filters: RecordFilters): Promise<RecordItem[]> { const { start, end } = monthRange(filters.month); const categoryIds = filters.categoryId ? new Set([filters.categoryId, ...(await db.categories.where('parentId').equals(filters.categoryId).primaryKeys() as number[])]) : undefined; let rows = await db.records.where('date').between(start, end, true, true).reverse().sortBy('date'); rows = rows.reverse(); return rows.filter(r => (!filters.type || r.type === filters.type) && (!categoryIds || categoryIds.has(r.categoryId)) && (!filters.keyword || r.remark.toLowerCase().includes(filters.keyword.toLowerCase()))) },
  async recent(limit = 6) { return db.records.orderBy('createdAt').reverse().limit(limit).toArray() },
  async listBetween(start: string, end: string): Promise<RecordItem[]> {
    return db.records.where('date').between(start, end, true, true).reverse().sortBy('date').then(rows => rows.reverse())
  },
  async save(item: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }) { const now = Date.now(); return db.transaction('rw', db.records, db.dailyExpenses, async () => { const previous = item.id ? await db.records.get(item.id) : undefined; const id = item.id ? (await db.records.update(item.id, { ...item, updatedAt: now }), item.id) : await db.records.add({ ...item, createdAt: now, updatedAt: now }); await syncDailyExpense(item.date); if (previous && previous.date !== item.date) await syncDailyExpense(previous.date); return id }) },
  async remove(id: number) { await db.transaction('rw', db.records, db.dailyExpenses, async () => { const record = await db.records.get(id); await db.records.delete(id); if (record) await syncDailyExpense(record.date) }) },
  async get(id: number) { return db.records.get(id) },
  async summary(month: string): Promise<MonthSummary> { const rows = await this.list({ month }); const expense = rows.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0); const income = rows.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0); return { expense, income, balance: income - expense } },
  async summaryBetween(start: string, end: string): Promise<MonthSummary> {
    const rows = await this.listBetween(start, end)
    const expense = rows.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
    const income = rows.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
    return { expense, income, balance: income - expense }
  },
  async todayExpense(today: string) { return (await db.dailyExpenses.get(today))?.amount ?? 0 }
}
