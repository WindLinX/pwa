import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { recordService } from './recordService'
describe('record service', () => {
  beforeEach(async () => { await db.records.clear() })
  it('calculates monthly summary from integer cents', async () => {
    await db.records.bulkAdd([{ type:'expense', amount:1234, categoryId:1, date:'2026-09-20', remark:'',createdAt:1,updatedAt:1 }, { type:'income', amount:5000, categoryId:2, date:'2026-09-21', remark:'',createdAt:2,updatedAt:2 }, { type:'expense', amount:99, categoryId:1, date:'2026-10-01', remark:'',createdAt:3,updatedAt:3 }])
    await expect(recordService.summary('2026-09')).resolves.toEqual({ expense:1234, income:5000, balance:3766 })
    await expect(recordService.summaryBetween('2026-09-20', '2026-09-20')).resolves.toEqual({ expense:1234, income:0, balance:-1234 })
    await expect(recordService.summaryBetween('2026-01-01', '2026-12-31')).resolves.toEqual({ expense:1333, income:5000, balance:3667 })
  })
})
