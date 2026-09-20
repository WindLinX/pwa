<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { localDate, monthRange } from '@/utils/date'
import { recordService } from '@/services/recordService'
import { categoryService } from '@/services/categoryService'
import { budgetService, type BudgetStatus } from '@/services/budgetService'
import type { Category, MonthSummary, RecordItem } from '@/types'
import { formatMoney } from '@/utils/money'

type Period = 'day' | 'month' | 'year'

const router = useRouter()
const period = ref<Period>('day')
const periodValue = ref(localDate())
const summary = ref<MonthSummary>({ expense: 0, income: 0, balance: 0 })
const budget = ref<BudgetStatus>()
const records = ref<RecordItem[]>([])
const categories = ref<Category[]>([])
const periodRange = computed(() => {
  if (period.value === 'day') return { start: periodValue.value, end: periodValue.value }
  if (period.value === 'month') return monthRange(periodValue.value)
  return { start: `${periodValue.value}-01-01`, end: `${periodValue.value}-12-31` }
})
const periodTitle = computed(() => period.value === 'day' ? `${periodValue.value} 账本` : period.value === 'month' ? `${periodValue.value.replace('-', ' 年 ')} 月账本` : `${periodValue.value} 年账本`)
const balance = computed(() => period.value === 'day' && budget.value?.configured ? budget.value.dailyRemaining : summary.value.balance)
const balanceTitle = computed(() => period.value === 'day' ? budget.value?.configured ? '当日额度结余' : '当日结余' : period.value === 'month' ? '当月结余' : '当年结余')
const monthlyBudgetStatus = computed(() => {
  if (period.value !== 'day' || !budget.value?.configured) return ''
  return budget.value.monthlyRemaining >= 0 ? `本月额度剩余 ${formatMoney(budget.value.monthlyRemaining)}` : `本月已超出 ${formatMoney(-budget.value.monthlyRemaining)}`
})
const categoryCards = (recordType: 'expense' | 'income') => computed(() => {
  const totals = new Map<number, number>()
  records.value.filter(record => record.type === recordType).forEach(record => totals.set(record.categoryId, (totals.get(record.categoryId) ?? 0) + record.amount))
  return categories.value.filter(category => category.type === recordType && !category.parentId).map(category => ({ category, amount: categories.value.filter(child => child.parentId === category.id).reduce((sum, child) => sum + (totals.get(child.id!) ?? 0), totals.get(category.id!) ?? 0) }))
})
const expenseCards = categoryCards('expense')
const incomeCards = categoryCards('income')

function selectPeriod(next: Period) {
  const today = localDate()
  period.value = next
  periodValue.value = next === 'day' ? today : next === 'month' ? today.slice(0, 7) : today.slice(0, 4)
}

async function load() {
  const { start, end } = periodRange.value
  ;[summary.value, records.value, categories.value] = await Promise.all([
    recordService.summaryBetween(start, end),
    recordService.listBetween(start, end),
    categoryService.list(),
  ])
  budget.value = period.value === 'day' ? await budgetService.status(periodValue.value) : undefined
}

function addRecordForCategory(categoryId: number) {
  router.push({ path: '/add', query: { categoryId: String(categoryId) } })
}

watch([period, periodValue], load)
onMounted(load)
</script>
<template>
  <div class="home-view">
    <header class="home-head"><p>{{ periodTitle }}</p><div class="period-picker"><div class="segmented"><button :class="{ selected: period === 'day' }" @click="selectPeriod('day')">日</button><button :class="{ selected: period === 'month' }" @click="selectPeriod('month')">月</button><button :class="{ selected: period === 'year' }" @click="selectPeriod('year')">年</button></div><input v-model="periodValue" :type="period === 'day' ? 'date' : period === 'month' ? 'month' : 'number'" :min="period === 'year' ? '2000' : undefined" :max="period === 'year' ? '2100' : undefined" :aria-label="`${periodTitle}日期`" /></div></header>
    <section class="balance-card"><div class="balance-heading"><span>{{ balanceTitle }}</span><small v-if="monthlyBudgetStatus">{{ monthlyBudgetStatus }}</small></div><b>{{ formatMoney(balance) }}</b><div class="balance-summary"><span>收入 <strong>{{ formatMoney(summary.income) }}</strong></span><span>支出 <strong>{{ formatMoney(summary.expense) }}</strong></span></div></section>
    <section class="section category-overview"><div class="section-title"><h2>支出</h2><span>选择分类开始记账</span></div><div class="category-expense-grid"><button v-for="item in expenseCards" :key="item.category.id" type="button" class="category-expense-card" :aria-label="`记录${item.category.name}`" @click="addRecordForCategory(item.category.id!)"><i>{{ item.category.icon }}</i><span>{{ item.category.name }}</span><strong>{{ formatMoney(item.amount) }}</strong></button></div></section>
    <section class="section category-overview"><div class="section-title"><h2>收入</h2><span>选择分类开始记账</span></div><div class="category-expense-grid"><button v-for="item in incomeCards" :key="item.category.id" type="button" class="category-expense-card income-card" :aria-label="`记录${item.category.name}`" @click="addRecordForCategory(item.category.id!)"><i>{{ item.category.icon }}</i><span>{{ item.category.name }}</span><strong>{{ formatMoney(item.amount) }}</strong></button></div></section>
  </div>
</template>
