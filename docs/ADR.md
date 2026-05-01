# OfferTrack 架构决策文档（ADR）

| 项目 | 内容 |
|------|------|
| 产品名称 | OfferTrack |
| 文档版本 | v2.0 |
| 创建日期 | 2026-05-01 |
| 状态 | 已确认，待实现 |

---

## 1. 架构总览

Electron 桌面应用，主进程 + 渲染进程架构。

```
┌──────────────────────────────────────────────┐
│              Electron Main Process            │
│  ┌──────────┐  ┌────────────┐                │
│  │ Window   │  │ File I/O   │                │
│  │ 管理     │  │ (导入/导出) │                │
│  └────┬─────┘  └─────┬──────┘                │
│       └──────┬───────┘                       │
│         Preload (IPC bridge)                 │
│              │                               │
│  ┌───────────┴──────────────┐                │
│  │   Renderer (React SPA)   │                │
│  │                          │                │
│  │  React Router + AntD     │                │
│  │  Zustand Store + persist │                │
│  │  localStorage            │                │
│  └──────────────────────────┘                │
└──────────────────────────────────────────────┘
```

---

## 2. 技术选型

### 2.1 Electron + electron-vite

使用 `electron-vite` 标准化项目结构。不用 Tauri（需要 Rust 工具链），不用 Node 本地服务 + 浏览器（用户要求独立桌面应用）。

### 2.2 前端：React 18 + TypeScript + Vite

继续使用，不变。

### 2.3 UI：Ant Design 5

继续使用。主要用到的组件：Tabs、Modal、Form、Input、Select、Pagination、Calendar、Popover、Tag、Card、Empty、Popconfirm、Button、Dropdown。

### 2.4 路由：React Router v6

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | GroupList | 面试组列表 |
| `/group/:groupId` | RecordList | 组内记录列表 |
| `/record/:id` | RecordDetail | 记录详情 + 流程操作 |
| `/board` | Board | 看板（带组筛选） |
| `/calendar` | Calendar | 日历 |
| `/settings` | Settings | 节点模板管理 |

### 2.5 状态管理：Zustand + persist

**Store 结构：**

```typescript
interface RecordState {
  version: number
  groups: Group[]
  stageTemplates: StageTemplate[]
  records: InterviewRecord[]
}
```

persist key: `offer-track-storage`。使用 `version` + `migrate` 处理 v1.0 数据迁移。

### 2.6 数据持久化：localStorage

数据量小，个人工具，localStorage 足够。JSON 导入导出作为备份手段。不引入文件系统存储。

### 2.7 导入导出：Electron Dialog

通过 IPC 使用 Electron 原生文件对话框，比浏览器 `<input type="file">` 体验更好。

---

## 3. 数据模型

### 3.1 核心类型

```typescript
type StageNodeStatus = 'pending' | 'ongoing' | 'passed' | 'terminated'
type EndReason = 'completed' | 'terminated'

interface Group {
  id: string; name: string; createdAt: string; updatedAt: string
}

interface StageTemplate {
  id: string; name: string; order: number; createdAt: string; updatedAt: string
}

interface StageNode {
  id: string; templateId: string; name: string; order: number
  status: StageNodeStatus
  scheduledAt?: string
  format?: 'video' | 'onsite' | 'phone'
  duration?: number
}

interface InterviewRecord {
  id: string; groupId: string; companyName: string; position: string
  stageNodes: StageNode[]
  isEnded: boolean; endReason?: EndReason
  createdAt: string; updatedAt: string
}
```

### 3.2 关键设计决策

**快照策略：** 新建记录时从模板复制节点信息到记录内部。模板变更不影响已有记录。

**节点排期：** 排期信息（时间、形式、时长）直接放在 StageNode 上，不再需要独立的 Round 概念。日历事件来源于有 `scheduledAt` 的 StageNode。

**结束推导：** `isEnded` 和 `endReason` 由节点状态推导并冗余存储，方便筛选：
- 存在 `terminated` 节点 → `isEnded: true, endReason: 'terminated'`
- 所有节点 `passed` → `isEnded: true, endReason: 'completed'`
- 存在 `ongoing` 节点 → `isEnded: false`

**删除的 v1.0 概念：** Stage 枚举、EndStatus 枚举、Round/RoundType 接口、interviewDocUrl、selfRating。

---

## 4. 项目目录结构

```
offer-track/
├── electron/
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/index.ts
│   ├── store/useRecordStore.ts
│   ├── components/
│   │   ├── Layout/
│   │   ├── RecordCard/
│   │   └── StageProgress/
│   └── pages/
│       ├── GroupList/
│       ├── RecordList/
│       ├── RecordDetail/
│       ├── Board/
│       ├── Calendar/
│       └── Settings/
├── docs/
│   ├── PRD.md
│   ├── ADR.md
│   ├── PLAN.md
│   ├── UI-SPEC.md
│   └── archive/
├── package.json
├── electron.vite.config.ts
└── electron-builder.yml
```

**删除的组件：** `components/RoundForm/`（轮次表单）。

---

## 5. 数据迁移

Zustand persist `version: 1`，`migrate` 函数处理 v1.0 → v2.0：

1. 创建"默认分组"和默认流程模板。
2. 旧记录归入默认分组。
3. 旧 `stage` / `endStatus` 映射为新 `stageNodes[]`。
4. 计算 `isEnded` / `endReason`。
5. 丢弃 `interviewDocUrl`、`rounds`、`selfRating` 等废弃字段。

旧 Stage 映射规则：

| 旧状态 | stageNodes 映射 |
|--------|----------------|
| `screening` | 简历筛选 `ongoing`，其余 `pending` |
| `technical` | 简历筛选 `passed`，技术面 `ongoing` |
| `hr` | 简历筛选、技术面 `passed`，HR面 `ongoing` |
| `offer` | 前三者 `passed`，Offer `ongoing` |
| `ended` + `offered` | 全部 `passed`，`endReason = 'completed'` |
| `ended` + `rejected`/`declined` | Offer `terminated` |

---

## 6. 风险与应对

| 风险 | 应对 |
|------|------|
| Electron 增加复杂度 | electron-vite 标准化结构，阶段 0 独立验证 |
| 数据模型大面积变更 | 先类型 + Store，再逐页面适配 |
| v1.0 数据迁移不完整 | 保守映射 + 导入导出备份 |
| 模板快照与看板列不匹配 | "其他流程"兜底列 |
| 分页筛选联动错乱 | 条件变更强制重置页码 |

---

## 7. 被否决方案

| 方案 | 原因 |
|------|------|
| Node 本地服务 + 浏览器 | 用户要求桌面应用 |
| Tauri | 需 Rust 工具链 |
| 保留 Round 概念 | 用户选择用节点替代轮次 |
| 模板变更同步影响历史记录 | 破坏历史数据语义 |
| 文件系统存储 | 数据量小，localStorage 足够 |
