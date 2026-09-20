/** Currency is persisted in integer cents to prevent floating point rounding errors. */
export function parseMoney(value: string): number | null {
  const normalized = value.trim().replace(/[￥¥,\s]/g, '')
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  const cents = Number(whole) * 100 + Number((fraction + '00').slice(0, 2))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}
export function formatMoney(cents: number, withSymbol = true): string {
  const value = (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return withSymbol ? `¥${value}` : value
}
