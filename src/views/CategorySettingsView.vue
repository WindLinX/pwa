<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { categoryService } from '@/services/categoryService'
import type { Category, RecordType } from '@/types'

const route = useRoute()
const router = useRouter()
const type = ref<RecordType>('expense')
const categories = ref<Category[]>([])
const selected = ref<Category | null>(null)
const editing = ref<Category | null>(null)
const dialogOpen = ref(false)
const menuOpen = ref(false)
const name = ref('')
const icon = ref('🏷️')

const parentId = computed(() => {
  const value = Number(route.params.parentId)
  return Number.isInteger(value) && value > 0 ? value : undefined
})
const parent = computed(() => parentId.value ? categories.value.find(category => category.id === parentId.value) : undefined)
const displayedCategories = computed(() => parentId.value ? categories.value.filter(category => category.parentId === parentId.value) : categories.value.filter(category => !category.parentId))
const title = computed(() => parent.value ? `${parent.value.name}的子分类` : '分类设置')

async function load() {
  categories.value = await categoryService.list(type.value)
  if (parentId.value && !parent.value) router.replace('/category-settings')
}
function switchType(next: RecordType) {
  type.value = next
  if (parentId.value) router.replace('/category-settings')
}
function openCreate() {
  editing.value = null
  name.value = ''
  icon.value = '🏷️'
  dialogOpen.value = true
}
function openEdit(category: Category) {
  menuOpen.value = false
  editing.value = category
  name.value = category.name
  icon.value = category.icon
  dialogOpen.value = true
}
function openMenu(category: Category) { selected.value = category; menuOpen.value = true }
async function save() {
  if (!name.value.trim()) return
  try {
    await categoryService.save({ id: editing.value?.id, name: name.value.trim(), icon: icon.value || '🏷️', type: type.value, parentId: parentId.value, sort: editing.value?.sort ?? displayedCategories.value.length })
    dialogOpen.value = false
    await load()
  } catch (error) { alert(error instanceof Error ? error.message : '保存失败') }
}
async function removeSelected() {
  if (!selected.value) return
  const category = selected.value
  menuOpen.value = false
  try {
    if (confirm(`删除“${category.name}”吗？`)) {
      await categoryService.remove(category.id!)
      await load()
    }
  } catch (error) { alert(error instanceof Error ? error.message : '删除失败') }
}
function openChildren() {
  if (!selected.value) return
  const id = selected.value.id
  menuOpen.value = false
  router.push(`/category-settings/${id}`)
}
watch(() => route.params.parentId, load)
onMounted(load)
</script>

<template>
  <header class="simple-head category-settings-head"><button aria-label="返回" @click="parentId ? router.back() : router.push('/settings')">‹</button><h1>{{ title }}</h1><button class="category-add" aria-label="新增分类" @click="openCreate">＋</button></header>
  <div v-if="!parentId" class="type-switch category-type-switch"><button :class="{ selected: type === 'expense' }" @click="switchType('expense')">支出</button><button :class="{ selected: type === 'income' }" @click="switchType('income')">收入</button></div>
  <p v-if="parentId" class="category-page-hint">仅管理“{{ parent?.name }}”下的子分类</p>
  <section class="category-settings-list" aria-label="分类列表">
    <div v-for="category in displayedCategories" :key="category.id" class="category-settings-row">
      <i>{{ category.icon }}</i><span><strong>{{ category.name }}</strong><small v-if="!parentId">{{ categories.filter(item => item.parentId === category.id).length ? `${categories.filter(item => item.parentId === category.id).length} 个子分类` : '暂无子分类' }}</small></span>
      <button class="category-more" :aria-label="`管理${category.name}`" @click.stop="openMenu(category)">⋯</button>
    </div>
    <p v-if="!displayedCategories.length" class="empty">还没有分类，点击右上角“＋”新增。</p>
  </section>

  <Teleport to="body"><div v-if="menuOpen && selected" class="sheet-backdrop" @click.self="menuOpen = false"><section class="category-action-sheet" role="dialog" aria-modal="true" :aria-label="`${selected.name}的操作`"><p>{{ selected.icon }} {{ selected.name }}</p><button @click="openEdit(selected)">编辑分类</button><button v-if="!parentId" @click="openChildren">管理子分类</button><button class="sheet-danger" @click="removeSelected">删除分类</button><button class="sheet-cancel" @click="menuOpen = false">取消</button></section></div></Teleport>
  <Teleport to="body"><div v-if="dialogOpen" class="sheet-backdrop" @click.self="dialogOpen = false"><form class="category-editor" @submit.prevent="save"><header><h2>{{ editing ? '编辑分类' : `新增${parentId ? '子' : '一级'}分类` }}</h2><button type="button" aria-label="关闭" @click="dialogOpen = false">×</button></header><div class="category-editor-fields"><label>图标<input v-model="icon" maxlength="4" aria-label="分类图标" /></label><label>名称<input v-model="name" maxlength="12" placeholder="例如：餐饮" aria-label="分类名称" autofocus /></label></div><button class="primary" type="submit">保存</button></form></div></Teleport>
</template>
