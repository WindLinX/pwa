import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { budgetService } from './budgetService'

describe('budget service', () => {
  beforeEach(async () => {
    await db.dailyExpenses.clear()
    await db.settings.clear()
  })

  it('counts allowance from the first day of the current month', async () => {
    await budgetService.setDailyAmount(10_000, '2026-09-20')
    await db.dailyExpenses.put({ date: '2026-09-20', amount: 1_200 })

    await expect(budgetService.status('2026-09-20')).resolves.toMatchObject({
      configured: true,
      dailyAmount: 10_000,
      spentToday: 1_200,
      dailyRemaining: 8_800,
      monthlyRemaining: 198_800,
    })
  })

  it('recalculates the whole current month when the allowance is configured mid-month', async () => {
    await budgetService.setDailyAmount(10_000, '2026-09-20')
    await db.dailyExpenses.bulkPut([
      { date: '2026-09-01', amount: 5_000 },
      { date: '2026-09-20', amount: 1_200 },
    ])

    await expect(budgetService.status('2026-09-20')).resolves.toMatchObject({
      spentToday: 1_200,
      dailyRemaining: 8_800,
      monthlyRemaining: 193_800,
    })
  })

  it('resets accumulated allowance and spending at the beginning of a new month', async () => {
    await budgetService.setDailyAmount(10_000, '2026-09-20')
    await db.dailyExpenses.bulkPut([
      { date: '2026-09-20', amount: 1_200 },
      { date: '2026-09-30', amount: 15_000 },
      { date: '2026-10-01', amount: 2_500 },
    ])

    await expect(budgetService.status('2026-10-01')).resolves.toMatchObject({
      spentToday: 2_500,
      dailyRemaining: 7_500,
      monthlyRemaining: 7_500,
    })
  })
})
