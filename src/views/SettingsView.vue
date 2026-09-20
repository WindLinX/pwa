<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { backupService, validateBackup } from '@/services/backupService'
import { budgetService, type BudgetStatus } from '@/services/budgetService'
import { settingsService } from '@/services/settingsService'
import type { BackupFile } from '@/types'
import { localDate } from '@/utils/date'
import { APP_VERSION } from '@/version'
import { formatMoney, parseMoney } from '@/utils/money'

const app = useAppStore()
const router = useRouter()
const lastBackup = ref('从未备份')
const budget = ref<BudgetStatus>()
const budgetDialogOpen = ref(false)
const budgetAmountText = ref('')
const budgetError = ref('')
const budgetSummary = computed(() => budget.value?.configured ? `每日 ${formatMoney(budget.value.dailyAmount)}` : '未设置')

async function load() {
  const time = Number(await settingsService.get('lastBackupTime', '0'))
  lastBackup.value = time ? new Date(time).toLocaleString('zh-CN') : '从未备份'
  budget.value = await budgetService.status(localDate())
}
function openBudgetDialog() {
  budgetAmountText.value = budget.value?.configured ? formatMoney(budget.value.dailyAmount, false) : '100'
  budgetError.value = ''
  budgetDialogOpen.value = true
}
async function saveBudget() {
  const amount = parseMoney(budgetAmountText.value)
  if (!amount) { budgetError.value = '请输入大于 0 的金额，最多两位小数'; return }
  await budgetService.setDailyAmount(amount, localDate())
  budgetDialogOpen.value = false
  await load()
}
async function restore(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; try { const data: unknown = JSON.parse(await file.text()); if (!validateBackup(data)) throw new Error('这不是有效的随手记备份文件'); const b = data as BackupFile; if (confirm(`将覆盖当前数据。备份时间：${new Date(b.exportTime).toLocaleString('zh-CN')}；账单 ${b.records.length} 笔。确定恢复吗？`)) { await backupService.restore(b); await app.initialize(); await load(); alert('数据已恢复') } } catch (error) { alert(error instanceof Error ? error.message : '恢复失败') } }
async function clear() { if (confirm('确定清空所有账单、分类和设置吗？此操作不可恢复。') && confirm('请再次确认：真的要清空全部本地数据吗？')) { await settingsService.clearAll(); await app.initialize(); await load() } }
onMounted(load)
</script>
<template>
  <header class="page-head"><h1>我的</h1></header>
  <section class="setting-group"><h2>外观</h2><label class="setting-row">深色模式<select :value="app.theme" @change="app.setTheme(($event.target as HTMLSelectElement).value)"><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label></section>
  <section class="setting-group"><h2>记账设置</h2><div class="setting-row"><span>每日花销额度<small>{{ budgetSummary }}</small></span><button @click="openBudgetDialog">设置</button></div><button class="setting-row setting-link" @click="router.push('/category-settings')"><span>分类设置<small>管理收支分类和子分类</small></span><b aria-hidden="true">›</b></button></section>
  <section class="setting-group"><h2>数据备份</h2><div class="setting-row"><span>上次备份<small>{{ lastBackup }}</small></span><button @click="backupService.download().then(load)">立即备份</button></div><label class="setting-row">恢复备份<input type="file" accept="application/json,.json" @change="restore" /></label><button class="danger-row" @click="clear">清空全部数据</button></section>
  <p class="about">随手记 v{{ APP_VERSION }}<br/>本地优先，所有数据仅保存在此设备浏览器中。</p>
  <Teleport to="body"><div v-if="budgetDialogOpen" class="amount-dialog-backdrop" @click.self="budgetDialogOpen = false"><section class="amount-dialog" role="dialog" aria-modal="true" aria-labelledby="budget-dialog-title"><header><div><p>每日花销额度</p><h2 id="budget-dialog-title">设置每天的预算</h2></div><button type="button" aria-label="关闭" @click="budgetDialogOpen = false">关闭</button></header><label class="dialog-amount amount-input"><b>¥</b><input v-model="budgetAmountText" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="0.00" aria-label="每日花销额度" /></label><p v-if="budgetError" class="form-error">{{ budgetError }}</p><p v-else class="dialog-hint">额度在本月内累计，下月重新计算</p><footer><button type="button" class="dialog-cancel" @click="budgetDialogOpen = false">取消</button><button type="button" class="primary" @click="saveBudget">保存额度</button></footer></section></div></Teleport>
</template>
