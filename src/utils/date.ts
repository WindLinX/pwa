export function localDate(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function currentMonth(date = new Date()): string { return localDate(date).slice(0, 7) }
export function monthRange(month: string): { start: string; end: string } { const [year, monthNumber] = month.split('-').map(Number); const next = new Date(year, monthNumber, 1); return { start: `${month}-01`, end: localDate(new Date(next.getTime() - 86400000)) } }
export function shiftMonth(month: string, amount: number): string { const [year, monthNumber] = month.split('-').map(Number); return currentMonth(new Date(year, monthNumber - 1 + amount, 1)) }
export function monthLabel(month: string): string { const [year, m] = month.split('-'); return `${year} 年 ${Number(m)} 月` }
