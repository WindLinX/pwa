# 随手记

本地优先的 Vue 3 iPhone PWA 记账应用。所有业务数据仅存于浏览器 IndexedDB，不需要账户或后端。

## 运行与构建

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

部署时将 `dist/` 目录发布到任意静态站点托管服务，并确保使用 HTTPS（localhost 除外）；Service Worker 才能正常工作。

## iPhone 安装

用 Safari 打开已部署的 HTTPS 地址，点浏览器底部“分享”按钮，选择“添加到主屏幕”。安装后的应用可离线打开、记账、查看账单和统计。

## 数据与备份

金额以整数分保存；业务日期是本地 `YYYY-MM-DD`。请定期从“我的 → 立即备份”导出 JSON；恢复为覆盖当前本地数据，操作前会显示备份信息并确认。iOS 不支持在未打开 PWA 时可靠地自动导出文件，因此只会在启动时提醒超过七天未备份。
