# 随手记开发指南

## 项目目标

这是一个纯前端、本地优先的个人记账 PWA。主要运行环境为 iPhone Safari 的“添加到主屏幕”模式，也应兼容桌面浏览器。

不得增加后端、账户体系、远程数据库或 CDN 依赖。业务数据必须仅保存在用户浏览器的 IndexedDB 中。

## 技术栈

- Vue 3、TypeScript、Composition API
- Vite、Vue Router、Pinia
- Dexie.js / IndexedDB
- ECharts
- vite-plugin-pwa / Workbox

## 目录说明

- `src/db/`：Dexie 数据库定义、迁移和初始分类。
- `src/services/`：账单、分类、设置、备份和统计等业务逻辑。页面不得直接散乱操作 IndexedDB。
- `src/views/`：路由页面。
- `src/components/`：可复用 UI 组件。
- `src/utils/`：金额与日期等无副作用公共逻辑。
- `src/stores/`：Pinia 应用状态。
- `src/test/` 与 `*.test.ts`：单元测试。

## 数据规则

- 金额必须以整数“分”保存，展示时使用 `src/utils/money.ts` 转换；禁止直接以浮点金额持久化或累计。
- 账单业务日期使用本地格式 `YYYY-MM-DD`，不得通过 UTC ISO 日期推导，避免时区跨日。
- `createdAt` 和 `updatedAt` 使用时间戳。
- 修改 IndexedDB schema 时新增 Dexie `version()` migration，绝不能通过更换数据库名称或清库来“升级”。
- 删除分类前必须检查是否有账单引用；存在引用时拒绝删除，不能静默修改历史账单。
- 统计应从账单实时计算，不能保存冗余月度统计数据。

## 备份与恢复

- 导出结构必须包含 `schemaVersion`、`appVersion`、`exportTime`、`records`、`categories`、`settings`。
- 恢复前必须完成格式、schema 版本和必要字段校验，并向用户说明备份时间及账单数量。
- 恢复必须在单个 Dexie transaction 中执行，并保留分类主键，否则账单的 `categoryId` 引用会损坏。
- iOS PWA 无法在应用未运行时可靠地自动导出本地文件；只能在启动时提醒用户超过七天未备份。

## UI 约束

- 手机优先，内容最大宽度为 460px，处理 `safe-area-inset-top` 与 `safe-area-inset-bottom`。
- 不引入大型 UI 组件库；保持核心金额和“记一笔”操作突出、单手可达。
- 所有新增界面必须同时检查浅色与深色主题。
- PWA 静态资源必须可离线使用，不得把核心运行时资源放在 CDN。

## 修改后验证

在项目根目录运行：

```bash
npm run lint
npm test
npm run build
```

对于影响交互、布局、PWA 安装或 IndexedDB 数据的改动，除静态检查外还应在浏览器中手动验证。生产部署必须使用 HTTPS（localhost 除外），否则 Service Worker 无法注册。
