import type { Category, RecordItem } from '@/types'
export interface CategoryTotal { categoryId: number; amount: number; category?: Category }
export function categoryExpenseTotals(records: RecordItem[], categories: Category[]): CategoryTotal[] {
  const totals = new Map<number, number>()
  records.filter(record => record.type === 'expense').forEach(record => totals.set(record.categoryId, (totals.get(record.categoryId) ?? 0) + record.amount))
  return [...totals].map(([categoryId, amount]) => ({ categoryId, amount, category: categories.find(category => category.id === categoryId) })).sort((a, b) => b.amount - a.amount)
}
