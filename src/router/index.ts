import { createRouter, createWebHashHistory } from 'vue-router'
const router = createRouter({ history: createWebHashHistory(), routes: [
  { path: '/', component: () => import('@/views/HomeView.vue') },
  { path: '/records', component: () => import('@/views/RecordsView.vue') },
  { path: '/add', component: () => import('@/views/AddRecordView.vue') },
  { path: '/add/:id', component: () => import('@/views/AddRecordView.vue') },
  { path: '/stats', component: () => import('@/views/StatsView.vue') },
  { path: '/settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/category-settings', component: () => import('@/views/CategorySettingsView.vue') },
  { path: '/category-settings/:parentId', component: () => import('@/views/CategorySettingsView.vue') }
] })
export default router
