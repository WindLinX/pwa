import { describe, expect, it } from 'vitest'
import { expenseDefaults, incomeDefaults } from './defaultCategories'

describe('default categories', () => {
  it('includes the agreed home, pet, and other-income root categories', () => {
    expect(expenseDefaults.filter(category => ['居家', '宠物'].includes(category.name))).toEqual([
      { name: '居家', icon: '🏠', children: [] },
      { name: '宠物', icon: '🐾', children: [] },
    ])
    expect(incomeDefaults.find(category => category.name === '其他收入')).toEqual({ name: '其他收入', icon: '💵' })
  })
})
