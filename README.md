# OfferTrack

面向密集求职期的个人面试进度管理工具（Electron 桌面应用）。按求职批次管理面试记录、自由定制每家公司的面试流程节点、通过看板和日历获得全局视角。

## 快速开始

```bash
npm install              # 安装依赖
npm run dev              # 启动 Electron 开发模式
```

## 命令

```bash
npm run dev              # Electron 开发模式（独立窗口 + HMR）
npm run build            # 生产构建
npm run build:win        # 构建 Windows 便携版（release/*.exe）
npm run build:win:nsis   # 构建 Windows 安装包（需开启开发者模式）
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron + electron-vite | 桌面应用框架 |
| React 18 + TypeScript | UI |
| Ant Design 5 | 组件库 |
| Zustand | 状态管理 + localStorage 持久化 |
| dayjs | 日期处理 |

## 功能

- **面试组**：按求职批次（26年日常实习、27年暑期等）归类记录
- **灵活流程**：全局流程节点模板，每条记录自由组合节点（简历筛选→测评→技术面→HR面→Offer）
- **进度追踪**：节点通过（绿色）/ 进行中（蓝色）/ 终止（红色），支持任意节点终止与回退
- **看板**：动态列 + 面试组筛选
- **日历**：排期时间展示 + hover Popover 详情
- **导入导出**：JSON 格式，Electron 原生对话框

## 数据存储

数据保存在 Electron 内嵌 Chromium 的 localStorage 中。建议定期通过"导出"功能备份数据。

## 文档

| 文档 | 内容 |
|------|------|
| `docs/PRD.md` | 产品需求 |
| `docs/ADR.md` | 架构决策 |
| `docs/PLAN.md` | 执行计划 |
| `docs/UI-SPEC.md` | UI 视觉规范 |
