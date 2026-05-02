# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm install              # 安装依赖
npm run dev              # 启动 Electron 开发模式（独立窗口 + HMR）
npm run build            # electron-vite 生产构建，输出到 out/
npm run build:win        # 构建 Windows 便携版（release/*.exe）
npm run build:win:nsis   # 构建 Windows 安装包（需开启 Windows 开发者模式）
```

## 架构概览

Electron 桌面应用，主进程 + 渲染进程架构。数据通过 Zustand `persist` 中间件存于 `localStorage`（key: `offer-track-storage`）。

### 项目结构

```
electron/                  # Electron 主进程 & 预加载
├── main.ts                # 窗口管理、IPC（导入导出对话框）
└── preload.ts             # contextBridge 暴露 electronAPI

src/renderer/              # React 渲染进程
├── main.tsx               # 入口（HashRouter）
├── App.tsx                # 路由定义
├── types/index.ts         # 所有类型定义（单一来源）
├── store/useRecordStore.ts # Zustand store（含 v1.0→v2.0 迁移）
├── components/
│   ├── Layout/            # 导航壳 + 导入导出按钮
│   ├── RecordCard/        # 记录卡片
│   └── StageProgress/     # 流程节点进度条（圆点──圆点）
└── pages/
    ├── GroupList/         # 面试组列表（主页 /）
    ├── RecordList/        # 组内记录列表（/group/:groupId）
    ├── RecordDetail/      # 记录详情 + 流程操作（/record/:id）
    ├── Board/             # 看板动态列（/board）
    ├── Calendar/          # 日历 + Popover（/calendar）
    └── Settings/          # 流程节点模板管理（/settings）
```

### 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | GroupList | 主页，面试组卡片列表 |
| `/group/:groupId` | RecordList | 组内记录，搜索/筛选/分页 |
| `/record/:id` | RecordDetail | 记录详情，节点推进/终止/撤回 |
| `/board` | Board | 动态列看板 + 组筛选 |
| `/calendar` | Calendar | 月历 + hover Popover |
| `/settings` | Settings | 流程节点模板 CRUD |

### 数据模型

```typescript
type StageNodeStatus = 'pending' | 'ongoing' | 'passed' | 'terminated'

Group           { id, name, createdAt, updatedAt }
StageTemplate   { id, name, order, createdAt, updatedAt }
StageNode       { id, templateId, name, order, status,
                  scheduledAt?, format?, duration? }
InterviewRecord { id, groupId, companyName, position,
                  stageNodes[], isEnded, endReason?,
                  createdAt, updatedAt }
```

### 关键设计

- **快照策略**：新建记录时从模板复制节点，模板变更不影响已有记录
- **节点排期**：排期信息直接放在 StageNode 上（时间/形式/时长），日历事件来源于有 `scheduledAt` 的节点
- **结束推导**：`isEnded`/`endReason` 由节点状态推导并冗余存储
- **数据迁移**：Zustand persist `version: 1` + `migrate`，v1.0 旧数据自动迁移

## 开发规范

- 架构参考 `docs/ADR.md`，产品参考 `docs/PRD.md`，UI 参考 `docs/UI-SPEC.md`
- 不确定时向用户确认，使用 Git 规范开发
- 代码注释用中文
- 样式：CSS Modules + Ant Design 组件
- 类型：`src/renderer/types/index.ts` 是所有类型的单一来源
