import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { backupService, validateBackup } from './backupService'

describe('backup service', () => {
  beforeEach(async () => { await Promise.all([db.records.clear(), db.categories.clear(), db.settings.clear(), db.dailyExpenses.clear()]) })

  it('validates required structure', () => { expect(validateBackup({ schemaVersion: 1, appVersion: '1', exportTime: 'x', records: [], categories: [], settings: [] })).toBe(true); expect(validateBackup({ schemaVersion: 2 })).toBe(false) })

  it('rebuilds daily expense cache when restoring records', async () => {
    await db.dailyExpenses.bulkPut([{ date: '2026-09-01', amount: 999 }, { date: '2026-09-03', amount: 999 }])
    await backupService.restore({ schemaVersion: 2, appVersion: '1.0.0', exportTime: '2026-09-20T00:00:00.000Z', categories: [{ id: 1, name: '餐饮', type: 'expense', icon: '🍜', sort: 0, createdAt: 1 }, { id: 2, name: '工资', type: 'income', icon: '💰', sort: 0, createdAt: 1 }], records: [{ id: 1, type: 'expense', amount: 1200, categoryId: 1, date: '2026-09-02', remark: '', createdAt: 1, updatedAt: 1 }, { id: 2, type: 'expense', amount: 300, categoryId: 1, date: '2026-09-02', remark: '', createdAt: 1, updatedAt: 1 }, { id: 3, type: 'income', amount: 5000, categoryId: 2, date: '2026-09-02', remark: '', createdAt: 1, updatedAt: 1 }], settings: [] })
    await expect(db.dailyExpenses.toArray()).resolves.toEqual([{ date: '2026-09-02', amount: 1500 }])
  })
})