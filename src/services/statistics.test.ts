import { describe, expect, it } from 'vitest'
import { categoryExpenseTotals } from './statistics'
describe('category statistics', () => it('excludes income and ranks expense categories', () => {
  const records = [{ id:1,type:'expense' as const,amount:200,categoryId:1,date:'2026-09-01',remark:'',createdAt:1,updatedAt:1 }, { id:2,type:'expense' as const,amount:500,categoryId:2,date:'2026-09-02',remark:'',createdAt:1,updatedAt:1 }, { id:3,type:'income' as const,amount:999,categoryId:1,date:'2026-09-02',remark:'',createdAt:1,updatedAt:1 }]
  expect(categoryExpenseTotals(records, [{ id:1,name:'餐饮',type:'expense',icon:'🍜',sort:0,createdAt:1 }, { id:2,name:'交通',type:'expense',icon:'🚇',sort:1,createdAt:1 }]).map(x => [x.category?.name,x.amount])).toEqual([['交通',500],['餐饮',200]])
}))
