# OfferTrack 架构决策文档（ADR）

| 项目 | 内容 |
|------|------|
| 产品名称 | OfferTrack |
| 文档版本 | v2.0 |
| 创建日期 | 2026-04-23 |
| 最近更新 | 2026-04-30 |
| 状态 | 已确认，待实现 |

---

## 1. 架构总览

OfferTrack v2.0 仍采用**前端单页应用（SPA）为核心**的架构，数据继续通过 Zustand persist 持久化在浏览器 `localStorage` 中。

为优化本地使用体验，本版本新增一个极简 Node.js 本地静态服务，仅用于：

1. 提供生产构建后的静态文件。
2. 暴露 `/api/shutdown` 接口，用于应用内关闭本地服务进程。

该本地服务不承载业务数据存储，不提供业务 API，不引入数据库。

```text
┌─────────────────────────────────────────────────────┐
│                   Windows 本机                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                浏览器 / Chromium               │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │              React SPA                  │  │  │
│  │  │                                         │  │  │
│  │  │  ┌────────────┐  ┌──────────────────┐  │  │  │
│  │  │  │ ReactRouter │  │ Ant Design UI    │  │  │  │
│  │  │  └─────┬──────┘  └────────┬─────────┘  │  │  │
│  │  │        │                  │            │  │  │
│  │  │  ┌─────▼──────────────────▼────────┐   │  │  │
│  │  │  │       Zustand Store + persist    │   │  │  │
│  │  │  └──────────────┬──────────────────┘   │  │  │
│  │  │                 │                      │  │  │
│  │  │  ┌──────────────▼──────────────────┐   │  │  │
│  │  │  │          localStorage            │   │  │  │
│  │  │  └─────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                         ▲                           │
│                         │ 静态文件 / shutdown       │
│                         │                           │
│  ┌──────────────────────┴───────────────────────┐  │
│  │              Node local server                │  │
│  │  - serve dist                                 │  │
│  │  - POST /api/shutdown → process.exit(0)       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 2. 技术选型

### 2.1 前端框架：React 18 + TypeScript

**继续使用。**

决策理由：

- 当前项目已基于 React 18 + TypeScript 实现，迁移成本为零。
- 本次重构涉及 Group、StageTemplate、StageNode 等数据模型，TypeScript 类型约束价值更高。
- React 生态和 Ant Design 组合足以覆盖设置页、看板、日历、表单、弹窗等场景。

---

### 2.2 构建工具：Vite

**继续使用。**

决策理由：

- 当前项目已采用 Vite。
- 开发模式启动快，适合迭代。
- 生产构建可输出纯静态 `dist`，适合被本地 Node 服务托管。

---

### 2.3 UI 组件库：Ant Design 5

**继续使用。**

本次重构会继续使用 Ant Design 提供的：

- Tabs：面试组切换。
- Modal / Form / Input：新增记录、组管理、节点模板管理。
- Pagination：组内记录分页。
- Calendar / Popover：日历与 hover 详情。
- Tag / Card / Empty / Popconfirm：看板、记录卡片、删除确认。
- Steps / Timeline：流程节点展示。

---

### 2.4 路由：React Router v6

**继续使用。**

v2.0 路由结构：

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 记录列表 | 面试组、记录列表、分页 |
| `/board` | 看板 | 全局动态流程看板 |
| `/calendar` | 日历 | 全局面试安排 |
| `/settings` | 设置 | 全局流程节点模板管理 |
| `/record/:id` | 记录详情 | 单条记录详情和流程节点操作 |

---

### 2.5 状态管理：Zustand + persist

**继续使用，但 Store 结构需要重构。**

v2.0 Store 核心状态：

```typescript
interface RecordState {
  version: number
  groups: Group[]
  stageTemplates: StageTemplate[]
  records: InterviewRecord[]
}
```

Store 需要新增能力：

- 面试组 CRUD。
- 全局节点模板 CRUD 和排序。
- 新增记录时生成节点快照。
- 节点推进、终止、撤回。
- 数据导入导出。
- v1.0 数据迁移。

---

### 2.6 数据持久化：localStorage

**继续使用，不迁移到文件系统。**

决策理由：

- 项目仍是个人工具，数据量较小。
- 当前 localStorage + Zustand persist 方案稳定、简单。
- 引入文件系统存储需要 Electron、Tauri 或浏览器文件 API，复杂度上升。
- 本版本新增 JSON 导入导出作为备份手段，降低 localStorage 数据丢失风险。

风险：

- 清理浏览器数据可能导致记录丢失。

应对：

- 提供显式“导出数据”功能。
- 导入前提示覆盖风险。

---

### 2.7 本地运行方式：Node 静态服务

**新增。**

不用 Electron 的原因：

- Electron 打包体积大，对本项目偏重。
- Electron 会引入主进程、预加载脚本、打包配置、更新策略等维护成本。
- 若迁移到 Electron 推荐改为文件存储，会进一步增加重构范围。
- 当前主要诉求是“不占命令行窗口”和“应用内关闭服务”，用 Node 静态服务即可满足。

本地服务职责：

- 托管 Vite 生产构建产物 `dist`。
- 处理 SPA fallback，将未知路径返回 `index.html`。
- 提供 `POST /api/shutdown`，收到请求后退出进程。

非职责：

- 不存储业务数据。
- 不提供业务 CRUD API。
- 不替代 Zustand store。

---

## 3. 数据模型决策

### 3.1 面试组

新增 `Group`，每条记录通过 `groupId` 归属一个组。

决策：

- 默认分组自动创建。
- 默认分组不能删除。
- 有记录的组不能删除。
- 删除组不做自动迁移，避免误操作导致记录归属混乱。

---

### 3.2 流程节点模板与快照

本版本将固定 `Stage` 枚举替换为：

- `StageTemplate`：全局模板。
- `StageNode`：记录内快照。

采用快照策略的原因：

- 面试记录代表历史过程，流程节点应稳定可回溯。
- 如果模板变更同步影响历史记录，会造成历史记录语义混乱。
- 快照方式让模板管理和历史记录互不干扰。

影响：

- 新建记录使用当前模板。
- 已有记录不受模板新增、删除、重命名、排序影响。
- 看板需要“其他流程”兜底列处理模板已删除但记录仍引用的场景。

---

### 3.3 结束状态

废弃旧的 `Stage.ENDED` 和 `EndStatus` 作为阶段模型。

新逻辑：

- 所有节点均 `passed` → `endReason = 'completed'`。
- 存在 `terminated` 节点 → `endReason = 'terminated'`。
- 存在 `ongoing` 节点 → 进行中。

为了渲染和筛选效率，记录可以冗余存储：

```typescript
isEnded: boolean
endReason?: 'completed' | 'terminated'
```

---

### 3.4 删除字段

v2.0 移除：

- `InterviewRecord.interviewDocUrl`
- `Round.selfRating`

历史 localStorage 数据中如果仍存在这些字段，读取时自然忽略，不需要单独清洗。

---

## 4. 数据迁移决策

### 4.1 Zustand persist 版本迁移

当前 v1.0 数据结构与 v2.0 不兼容，需要使用 Zustand persist 的 `version` 与 `migrate` 能力。

迁移目标：

- 创建默认分组。
- 创建默认流程模板。
- 为历史记录补充 `groupId`。
- 将旧 `stage` / `endStatus` 转换为新的 `stageNodes`。
- 计算 `isEnded` 和 `endReason`。
- 移除或忽略 `interviewDocUrl` 与 `selfRating`。

### 4.2 旧 Stage 到新节点的映射

默认映射：

| 旧 Stage | 新节点状态 |
|----------|------------|
| `screening` | 简历筛选 `ongoing`，后续 `pending` |
| `technical` | 简历筛选 `passed`，技术面 `ongoing` |
| `hr` | 简历筛选、技术面 `passed`，HR面 `ongoing` |
| `offer` | 简历筛选、技术面、HR面 `passed`，Offer `ongoing` |
| `ended` + `offered` | 所有默认节点 `passed`，`endReason = completed` |
| `ended` + `rejected` / `declined` | 根据可推断阶段设置 `terminated`；无法推断时在最后一个已知节点终止 |

由于 v1.0 `ended` 未保留终止发生在哪个节点，迁移时无法完全还原。采用保守策略：

- `offered` 迁移为完成。
- `rejected` / `declined` 迁移为“Offer”节点终止或最后可识别节点终止。

---

## 5. 导入导出决策

### 5.1 导出格式

导出完整业务状态，而不是导出 localStorage 原始结构。

```json
{
  "version": "2.0",
  "exportedAt": "2026-04-30T12:00:00.000Z",
  "stageTemplates": [],
  "groups": [],
  "records": []
}
```

### 5.2 导入策略

- 导入前校验必要字段。
- 导入会覆盖当前全部数据。
- 覆盖前必须二次确认。
- 导入后重新加载或刷新页面，确保 Zustand 状态与 localStorage 一致。

---

## 6. 目录结构调整

v2.0 预计新增或改造如下：

```text
src/
├── components/
│   ├── Layout/
│   ├── RecordCard/
│   ├── RoundForm/
│   └── StageProgress/
├── pages/
│   ├── Board/
│   ├── Calendar/
│   ├── RecordDetail/
│   ├── RecordList/
│   └── Settings/
│       ├── index.tsx
│       └── Settings.module.css
├── store/
│   └── useRecordStore.ts
├── types/
│   └── index.ts
└── utils/
    └── dataTransfer.ts      # 可选：导入导出工具函数

server.mjs                  # 本地静态服务 + shutdown
start.bat                   # Windows 隐藏启动脚本
```

说明：

- `utils/dataTransfer.ts` 是否新增视实现复杂度决定。
- 优先复用现有组件和页面目录。
- 不主动引入额外状态库或后端框架。

---

## 7. 启动与部署

### 7.1 开发模式

```bash
npm install
npm run dev
```

开发模式仍使用 Vite dev server。

注意：

- 开发模式下 `/api/shutdown` 不可用，点击关闭应用按钮时应给出友好提示。

### 7.2 本地使用模式

```bash
npm run build
npm run serve
```

或双击 `start.bat`：

- 构建前端产物。
- 隐藏窗口启动 Node 本地服务。
- 自动打开浏览器。
- 用户点击应用内“关闭应用”按钮后服务退出。

### 7.3 静态部署

仍可部署到 GitHub Pages / Vercel / Netlify 等静态托管服务。

限制：

- 静态部署环境中“关闭应用”按钮不可用，应隐藏或提示仅本地服务模式支持。

---

## 8. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| 数据模型重构范围大 | 多页面、多组件同时受影响 | 先完成类型和 Store，再逐页适配 |
| v1.0 数据迁移不完整 | 旧结束状态无法完全还原终止节点 | 使用保守迁移策略，并在文档中说明 |
| 模板快照与当前模板不一致 | 看板动态列无法匹配部分记录 | 增加“其他流程”兜底列 |
| localStorage 数据丢失 | 用户清缓存会丢数据 | 增加导入导出功能 |
| `/api/shutdown` 环境差异 | 开发或静态部署不可用 | 前端捕获失败并提示仅本地服务模式支持 |
| 组内分页与筛选联动 | 页码可能越界或展示空页 | 搜索、筛选、切组时重置页码 |

---

## 9. 被否决方案

### 9.1 Electron

未采用原因：

- 打包体积明显增加。
- 构建和发布流程复杂化。
- 需要引入主进程、预加载脚本、安全边界处理。
- 若同时迁移文件存储，工作量进一步扩大。

### 9.2 后端数据库

未采用原因：

- 当前是个人本地工具，无多用户协作需求。
- 数据量小，localStorage 足够。
- 后端数据库会显著增加维护成本。

### 9.3 模板变更同步影响历史记录

未采用原因：

- 历史记录应保留当时流程状态。
- 同步修改会导致旧记录语义变化。
- 快照模型更符合记录型工具的语义。

---

## 10. 后续扩展考虑

| 方向 | 可能方案 |
|------|----------|
| 桌面应用 | 后续如确有必要再评估 Tauri / Electron |
| 文件存储 | 可在桌面应用阶段迁移到 JSON 文件或 SQLite |
| 提醒通知 | 可基于浏览器 Notification API 或桌面应用系统通知 |
| 数据统计 | 按组、节点、公司类型统计通过率和进度 |
| 云同步 | 后续可抽象 Store 持久化层，对接后端 |
