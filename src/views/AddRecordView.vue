<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { categoryService } from '@/services/categoryService'
import { recordService } from '@/services/recordService'
import { settingsService } from '@/services/settingsService'
import type { Category, RecordType } from '@/types'
import { localDate } from '@/utils/date'
import { formatMoney, parseMoney } from '@/utils/money'

const router = useRouter()
const route = useRoute()
const type = ref<RecordType>('expense')
const amountText = ref('')
const date = ref(localDate())
const remark = ref('')
const categoryId = ref<number>()
const categories = ref<Category[]>([])
const saving = ref(false)
const amountError = ref('')
const isEdit = computed(() => !!route.params.id)
const primaryCategory = computed(() => { const selected = categories.value.find(category => category.id === categoryId.value); return selected?.parentId ? categories.value.find(category => category.id === selected.parentId) : selected })
const childCategories = computed(() => primaryCategory.value ? categories.value.filter(category => category.parentId === primaryCategory.value?.id) : [])
const dateLabel = computed(() => { const [year, month, day] = date.value.split('-'); return `${year}年${Number(month)}月${Number(day)}日` })

async function loadCategories() {
  const selectedType = type.value
  const listed = await categoryService.list(selectedType)
  if (selectedType !== type.value) return
  categories.value = listed
}

watch(amountText, () => { amountError.value = '' })

async function load() {
  type.value = (await settingsService.get('defaultType', 'expense')) as RecordType
  if (isEdit.value) {
    const record = await recordService.get(Number(route.params.id))
    if (record) {
      type.value = record.type
      amountText.value = formatMoney(record.amount, false)
      date.value = record.date
      remark.value = record.remark
      categoryId.value = record.categoryId
    }
  } else {
    const requestedCategoryId = Number(route.query.categoryId)
    if (!Number.isInteger(requestedCategoryId) || requestedCategoryId <= 0) { router.replace('/'); return }
    const requestedCategory = await categoryService.get(requestedCategoryId)
    if (!requestedCategory || requestedCategory.parentId) { router.replace('/'); return }
    type.value = requestedCategory.type
    categoryId.value = requestedCategory.id
  }
  await loadCategories()
  if (!primaryCategory.value) router.replace('/')
}

async function submit() {
  const amount = parseMoney(amountText.value)
  if (!amount) {
    amountError.value = '请输入大于 0 的金额，最多两位小数'
    return
  }
  if (!categoryId.value || saving.value) return
  saving.value = true
  try {
    await recordService.save({ id: isEdit.value ? Number(route.params.id) : undefined, type: type.value, amount, categoryId: categoryId.value, date: date.value, remark: remark.value.trim() })
    await settingsService.set('defaultType', type.value)
    await settingsService.set(`lastCategory:${type.value}`, String(categoryId.value))
    router.replace(isEdit.value ? '/records' : '/')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <header class="simple-head"><button @click="router.back()">‹</button><h1>{{ isEdit ? '编辑账单' : '记一笔' }}</h1><span /></header>
  <section class="amount-box" aria-labelledby="amount-label">
    <span id="amount-label">金额</span>
    <label class="amount-input"><b>¥</b><input v-model="amountText" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="0.00" aria-label="金额" /></label>
    <p v-if="amountError" class="form-error">{{ amountError }}</p>
  </section>
  <section v-if="childCategories.length" class="form-block"><label>{{ primaryCategory?.icon }} {{ primaryCategory?.name }} <small>可选细分</small></label><div class="category-grid"><button v-for="c in childCategories" :key="c.id" :class="{ selected: categoryId === c.id }" @click="categoryId = c.id"><i>{{ c.icon }}</i>{{ c.name }}</button></div></section>
  <section class="form-block fields"><label>日期<span class="date-field"><span>{{ dateLabel }}</span><input v-model="date" type="date" aria-label="日期" /></span></label><label>备注<input v-model="remark" maxlength="100" placeholder="可选" /></label></section>
  <button class="primary save" :disabled="saving" @click="submit">{{ saving ? '保存中…' : '保存账单' }}</button>
</template>
