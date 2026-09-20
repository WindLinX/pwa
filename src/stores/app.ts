import { defineStore } from 'pinia'
import { seedDatabase } from '@/db/seed'
import { settingsService } from '@/services/settingsService'

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')

export const useAppStore = defineStore('app', {
  state: () => ({ theme: 'light', backupDue: false, ready: false }),
  actions: {
    async initialize() {
      await seedDatabase()
      const savedTheme = await settingsService.get('theme', 'light')
      this.theme = ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'light'
      this.applyTheme()
      const last = Number(await settingsService.get('lastBackupTime', '0'))
      this.backupDue = !last || Date.now() - last > 7 * 86400000
      this.ready = true
    },
    applyTheme() {
      document.documentElement.dataset.theme = this.theme === 'system'
        ? (systemTheme.matches ? 'dark' : 'light')
        : this.theme
    },
    async setTheme(value: string) {
      this.theme = ['light', 'dark', 'system'].includes(value) ? value : 'light'
      await settingsService.set('theme', this.theme)
      this.applyTheme()
    },
  },
})

systemTheme.addEventListener('change', () => {
  const savedTheme = document.documentElement.dataset.theme
  if (savedTheme) useAppStore().applyTheme()
})
