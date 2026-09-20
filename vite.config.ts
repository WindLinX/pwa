import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/pwa/',
  plugins: [vue(), VitePWA({ registerType: 'autoUpdate', manifest: { name: '随手记 - 本地记账', short_name: '随手记', theme_color: '#2d6a4f', background_color: '#f6f7f4', display: 'standalone', lang: 'zh-CN', icons: [{ src: 'pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' }, { src: 'pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }] } })],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
})
