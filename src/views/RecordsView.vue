<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ArrowLeft, ArrowRight, Delete } from '@element-plus/icons-vue'
import RecordRow from '@/components/RecordRow.vue'
import { categoryService } from '@/services/categoryService'
import { recordService } from '@/services/recordService'
import { categoryExpenseTotals } from '@/services/statistics'
import { currentMonth, localDate, shiftMonth } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import type { Category, RecordItem } from '@/types'

type Period = 'week' | 'month' | 'year' | 'all'
interface CalendarCell { label: string; date: string; muted?: boolean; amount?: number }
const router = useRouter()
const period = ref<Period>('month')
const anchor = ref(localDate())
const records = ref<RecordItem[]>([])
const categories = ref<Category[]>([])
const view = ref<'records' | 'report'>('records')
const showPicker = ref(false)
const periodOptions: { value: Period; label: string }[] = [{ value: 'week', label: '周' }, { value: 'month', label: '月' }, { value: 'year', label: '年' }, { value: 'all', label: '更多' }]
const chart = ref<HTMLElement>()
let chartInstance: echarts.ECharts | undefined
const map = computed(() => new Map(categories.value.map(category => [category.id, category])))
const selectedYear = computed(() => Number(anchor.value.slice(0, 4)))
const range = computed(() => periodRange(period.value, anchor.value))
const title = computed(() => period.value === 'week' ? '本周' : period.value === 'month' ? `${selectedYear.value} 年 ${Number(anchor.value.slice(5, 7))} 月` : period.value === 'year' ? `${selectedYear.value} 年` : '所有')
const calendarCells = computed(() => period.value === 'week' ? weekCells(anchor.value) : period.value === 'month' ? monthCells(selectedYear.value, Number(anchor.value.slice(5, 7))) : yearCells(selectedYear.value))
const summary = computed(() => records.value.reduce((total, item) => { total[item.type] += item.amount; return total }, { income: 0, expense: 0 }))
const balance = computed(() => summary.value.income - summary.value.expense)
const reportRecords = computed(() => {
  if (period.value === 'all') return records.value
  if (period.value === 'year') return records.value.filter(record => record.date.slice(0, 7) === anchor.value.slice(0, 7))
  return records.value.filter(record => record.date === anchor.value)
})
const reportSummary = computed(() => reportRecords.value.reduce((total, item) => { total[item.type] += item.amount; return total }, { income: 0, expense: 0 }))
const groups = computed(() => {
  const result: { date: string; rows: RecordItem[]; income: number; expense: number }[] = []
  records.value.forEach(record => { let group = result.find(item => item.date === record.date); if (!group) { group = { date: record.date, rows: [], income: 0, expense: 0 }; result.push(group) }; group.rows.push(record); group[record.type] += record.amount })
  return result
})
const rank = computed(() => categoryExpenseTotals(reportRecords.value, categories.value))
async function load() { records.value = period.value === 'all' ? await recordService.listAll() : await recordService.listBetween(range.value.start, range.value.end); categories.value = await categoryService.list(); await nextTick(); if (view.value === 'report') drawChart() }
function changePeriod(value: Period) { period.value = value; showPicker.value = false }
function move(amount: number) { const [year, month, day] = anchor.value.split('-').map(Number); if (period.value === 'week') anchor.value = localDate(new Date(year, month - 1, day + amount * 7)); else if (period.value === 'month') anchor.value = `${shiftMonth(currentMonth(new Date(year, month - 1, 1)), amount)}-01`; else if (period.value === 'year') anchor.value = `${year + amount}-01-01`; load() }
function selectCell(cell: CalendarCell) { anchor.value = cell.date; if (period.value !== 'year') load() }
async function remove(id: number) { if (confirm('确定删除这笔账单吗？此操作无法撤销。')) { await recordService.remove(id); await load() } }
function drawChart() { if (!chart.value) return; chartInstance?.dispose(); const tokens = getComputedStyle(document.documentElement); chartInstance = echarts.init(chart.value); chartInstance.setOption({ color: ['#579ff0', '#ffc951', '#ffe483', '#ff5e63', '#7ac9a4', '#8e83dd'], tooltip: { trigger: 'item', valueFormatter: (value: number) => formatMoney(value) }, series: [{ type: 'pie', radius: ['43%', '70%'], center: ['50%', '50%'], label: { show: true, color: tokens.getPropertyValue('--text').trim(), formatter: '{b} {d}%' }, labelLine: { length: 10, length2: 8 }, data: rank.value.map(item => ({ name: item.category?.name ?? '已删除分类', value: item.amount })) }] }) }
watch(view, async value => { if (value === 'report') { await nextTick(); drawChart() } })
watch(period, load)
onMounted(load)
onBeforeUnmount(() => chartInstance?.dispose())
function dateValue(date: Date) { return localDate(date) }
function expenseFor(date: string) { return records.value.filter(record => record.date === date && record.type === 'expense').reduce((sum, record) => sum + record.amount, 0) }
function monthCells(year: number, month: number): CalendarCell[] { const first = new Date(year, month - 1, 1); const offset = (first.getDay() + 6) % 7; return Array.from({ length: 42 }, (_, index) => { const date = new Date(year, month - 1, index - offset + 1); const value = dateValue(date); return { label: String(date.getDate()), date: value, muted: date.getMonth() !== month - 1, amount: expenseFor(value) } }) }
function weekCells(anchorDate: string): CalendarCell[] { const [year, month, day] = anchorDate.split('-').map(Number); const date = new Date(year, month - 1, day); const start = new Date(year, month - 1, day - ((date.getDay() + 6) % 7)); return Array.from({ length: 7 }, (_, index) => { const item = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index); const value = dateValue(item); return { label: String(item.getDate()), date: value, amount: expenseFor(value) } }) }
function yearCells(year: number): CalendarCell[] { return Array.from({ length: 12 }, (_, index) => { const month = `${year}-${String(index + 1).padStart(2, '0')}`; return { label: `${index + 1}月`, date: `${month}-01`, amount: records.value.filter(record => record.date.slice(0, 7) === month && record.type === 'expense').reduce((sum, record) => sum + record.amount, 0) } }) }
function periodRange(kind: Period, anchorDate: string) { const [year, month, day] = anchorDate.split('-').map(Number); if (kind === 'week') { const date = new Date(year, month - 1, day); const start = new Date(year, month - 1, day - ((date.getDay() + 6) % 7)); const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6); return { start: dateValue(start), end: dateValue(end) } }; if (kind === 'month') return { start: `${anchorDate.slice(0, 7)}-01`, end: dateValue(new Date(year, month, 0)) }; return { start: `${year}-01-01`, end: `${year}-12-31` } }
function dateLabel(date: string) { const [year, month, day] = date.split('-').map(Number); return `${month}月${day}日 周${'日一二三四五六'[new Date(year, month - 1, day).getDay()]}` }
</script>

<template>
  <div class="ledger-view">
    <header class="ledger-head"><div class="period-title"><button class="period-nav-arrow" type="button" aria-label="上一个周期" @click="move(-1)"><ArrowLeft /></button><button type="button" @click="showPicker = !showPicker">{{ title }}</button><button class="period-nav-arrow" type="button" aria-label="下一个周期" @click="move(1)"><ArrowRight /></button></div></header>
    <section v-if="showPicker" class="period-popover"><div class="period-options"><button v-for="option in periodOptions" :key="option.value" :class="{ selected: period === option.value }" @click="changePeriod(option.value)">{{ option.label }}</button></div><div v-if="period !== 'all'" class="picker-nav"><button aria-label="上一个周期" @click="move(-1)"><ArrowLeft /></button><strong>{{ period === 'year' ? selectedYear : title }}</strong><button aria-label="下一个周期" @click="move(1)"><ArrowRight /></button></div><div v-if="period === 'month'" class="month-choice"><button v-for="number in 12" :key="number" :class="{ selected: Number(anchor.slice(5, 7)) === number }" @click="anchor = `${selectedYear}-${String(number).padStart(2, '0')}-01`; load(); showPicker = false">{{ number }}月</button></div></section>
    <section v-if="view === 'records' && period !== 'all'" :class="['calendar-card', `calendar-${period}`]"><div v-if="period !== 'year'" class="weekdays"><span v-for="weekday in ['周一','周二','周三','周四','周五','周六','周日']" :key="weekday">{{ weekday }}</span></div><div class="calendar-grid"><button v-for="cell in calendarCells" :key="cell.date" type="button" :class="{ selected: cell.date === anchor, muted: cell.muted }" @click="selectCell(cell)"><span>{{ cell.label }}</span><small v-if="cell.amount">{{ formatMoney(cell.amount) }}</small></button></div><div class="summary-row"><span>收入<strong class="income">{{ formatMoney(summary.income) }}</strong></span><span>支出<strong class="expense">{{ formatMoney(summary.expense) }}</strong></span><span>结余<strong>{{ formatMoney(balance) }}</strong></span></div></section>
    <section v-if="view === 'records'" class="record-groups"><article v-for="group in groups" :key="group.date" class="ledger-day"><header><strong>{{ dateLabel(group.date) }}</strong><span><em v-if="group.income" class="income">收 {{ formatMoney(group.income) }}</em><em v-if="group.expense" class="expense">支 {{ formatMoney(group.expense) }}</em></span></header><div v-for="record in group.rows" :key="record.id" class="ledger-record"><RecordRow :record="record" :category="map.get(record.categoryId)" :parent-category="map.get(map.get(record.categoryId)?.parentId ?? -1)" @click="router.push(`/add/${record.id}`)" /><button class="delete-record" type="button" aria-label="删除账单" @click="remove(record.id!)"><Delete /></button></div></article><p v-if="!groups.length" class="empty ledger-empty">这个周期还没有账单，去记一笔吧。</p></section>
    <section v-else class="report-view"><article class="report-card"><header><h2>类别</h2><span>支出分布</span></header><div v-if="rank.length" ref="chart" class="category-chart"></div><p v-else class="empty">所选日期暂无支出数据</p><div class="report-totals"><span><i class="expense">支出</i><strong class="expense">{{ formatMoney(reportSummary.expense) }}</strong></span><span><i>收入</i><strong class="income">{{ formatMoney(reportSummary.income) }}</strong></span></div><h2 class="report-subtitle">类别统计</h2><div v-for="item in rank" :key="item.categoryId" class="category-rank"><i>{{ item.category?.icon ?? '📦' }}</i><strong>{{ item.category?.name ?? '已删除分类' }}</strong><small>{{ reportSummary.expense ? (item.amount / reportSummary.expense * 100).toFixed(1) : 0 }}%</small><b>{{ formatMoney(item.amount) }}</b></div></article></section>
    <div class="ledger-switch" role="tablist" aria-label="明细视图"><button :class="{ selected: view === 'records' }" role="tab" :aria-selected="view === 'records'" @click="view = 'records'">记录</button><button :class="{ selected: view === 'report' }" role="tab" :aria-selected="view === 'report'" @click="view = 'report'">报表</button></div>
  </div>
</template>
