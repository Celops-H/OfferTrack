# OfferTrack 重构需求文档

| 项目 | 内容 |
|------|------|
| 文档版本 | v2.0 |
| 创建日期 | 2026-04-30 |
| 最近更新 | 2026-04-30 |
| 状态 | 已确认，待编码 |

---

## 一、背景

OfferTrack v1.0 已完成基础功能开发，现对面试组、动态流程节点、日历增强、导入导出、本地应用关闭等功能进行一次中等规模重构，对应 v2.0 版本。

本次重构目标：

1. 支持按求职批次管理面试记录。
2. 将固定流程阶段改为全局预定义、可维护的流程节点模板。
3. 支持在任意节点终止流程，并用颜色表达节点状态。
4. 删除不再需要的技术面自评分、面经链接功能。
5. 增强日历视图和数据备份能力。
6. 优化本地启动和关闭体验，避免一直占用命令行窗口。

---

## 二、已确认的关键决策

| 决策项 | 结论 |
|--------|------|
| 流程节点来源 | 全局预定义模板 |
| 节点模板管理入口 | 新增独立设置页 `/settings` |
| 模板变更对历史记录的影响 | 使用快照方式，已有记录不受模板后续变更影响 |
| 看板展示范围 | 全局显示所有组记录，不提供组筛选 |
| 有记录的组是否允许删除 | 不允许删除，提示先删除或移动组内记录 |
| 组内记录展示 | 按分页展示 |
| 是否引入 Electron | 不引入 |
| 应用关闭方式 | 前端按钮调用本地 Node 服务 `/api/shutdown` 关闭进程 |
| 数据存储方式 | 仍使用 localStorage + Zustand persist |

---

## 三、需求详情

### 需求 1：面试组（Group）

#### 1.1 功能描述

在记录列表顶层新增“面试组”概念，用于将面试记录按求职批次归类，例如：

- 26年日常实习
- 27年暑期
- 秋招提前批

每条面试记录必须归属于一个组。

#### 1.2 数据模型

新增 `Group` 类型：

```typescript
interface Group {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
```

`InterviewRecord` 新增字段：

```typescript
groupId: string
```

#### 1.3 初始化与数据迁移

- 系统初始化时自动创建一个“默认分组”。
- 历史记录如果没有 `groupId`，迁移时统一归入“默认分组”。
- 默认分组不允许删除。

#### 1.4 记录列表页交互

记录列表页按组组织记录：

- 顶部展示组 Tab。
- 每个组 Tab 展示该组内的记录。
- 新增“全部”Tab，用于查看所有组记录。
- 新增记录时，默认归入当前选中的组。
- 如果当前处于“全部”Tab，新增记录时需要在弹窗内选择所属组。

组管理能力：

- 新增组。
- 重命名组。
- 删除组。

组删除规则：

- 默认分组不允许删除。
- 组内存在记录时不允许删除。
- 删除有记录的组时提示：“该组内仍有记录，请先删除或移动组内记录后再删除分组。”

#### 1.5 组内记录分页

每个组内记录列表需要分页展示。

分页规则：

- 默认每页 10 条。
- 支持切换每页数量：10 / 20 / 50。
- 搜索、筛选、排序先作用于当前组记录，再进行分页。
- 切换组、搜索关键字、切换筛选条件时，页码重置为第 1 页。
- “全部”Tab 同样使用分页。
- 分页组件展示在记录列表底部。

#### 1.6 看板视图中的组信息

看板全局展示所有组的进行中记录，不按组筛选。

看板中的每条记录需要展示所属组名，建议以 Tag 或次级文本形式展示。

#### 1.7 日历视图中的组信息

日历全局展示所有组的面试安排。

事件详情弹层中展示所属组名。

---

### 需求 2：动态流程节点

#### 2.1 功能描述

当前系统使用固定阶段枚举：

- 简历筛选中
- 技术面
- HR面
- Offer阶段
- 已结束

本次重构后，流程节点改为**全局节点库 + 每条记录自由组合**的模式：

- 在设置页维护全局节点库（可用的节点类型）。
- 每条记录创建时，从节点库中自由选择需要的节点，组合成该记录的流程。
- 不同记录可以有完全不同的流程节点组合。
- 记录详情页仍然使用圆点流程展示方式。

#### 2.2 全局节点库

新增 `StageTemplate`，作为全局可用的节点类型库。这里的 `StageTemplate` 不表示一整套固定流程模板，而是表示一个可被记录选择的流程节点。

```typescript
interface StageTemplate {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}
```

系统默认节点库：

| 顺序 | 节点名称 |
|------|----------|
| 1 | 简历筛选 |
| 2 | 测评 |
| 3 | 技术面 |
| 4 | HR面 |
| 5 | Offer |

#### 2.3 设置页

新增 `/settings` 设置页，用于管理全局节点库。

设置页功能：

- 查看节点库列表。
- 新增节点。
- 修改节点名称。
- 删除节点。
- 调整节点顺序（影响新建记录时节点选择器中的展示顺序）。

节点库约束：

- 节点名称必填。
- 节点名称不允许为空白字符串。
- 节点名称不允许重复。
- 至少保留 1 个节点。
- 删除节点只影响后续新建记录，不影响已有记录。
- 修改节点名称只影响后续新建记录，不影响已有记录。
- 调整节点顺序只影响后续新建记录的默认展示顺序，不影响已有记录。
- 删除节点时，如果有记录正在使用该节点，需要提示用户：`该节点正在被 X 条记录使用，删除后不影响已有记录，但无法再用于新建记录。`

#### 2.4 记录内节点快照

每条记录创建时，用户从节点库中选择需要的节点，并按需要调整顺序，组合成该记录自己的流程。

```typescript
type StageNodeStatus = 'pending' | 'ongoing' | 'passed' | 'terminated'

interface StageNode {
  id: string
  templateId: string
  name: string
  order: number
  status: StageNodeStatus
}
```

快照策略：

- 记录创建后，流程节点存在记录自身数据中。
- 记录内保存节点名称、顺序和状态，形成独立快照。
- 后续修改节点库，不改变已有记录的节点名称、顺序和数量。
- 这样可以避免历史记录因模板变化而混乱。

#### 2.5 节点状态

节点状态含义：

| 状态 | 含义 | 颜色 |
|------|------|------|
| `pending` | 未开始 / 未到达 | 灰色 |
| `ongoing` | 进行中 | 蓝色 |
| `passed` | 已通过 | 绿色 |
| `terminated` | 流程在此终止 | 红色 |

状态规则：

- 新建记录时，第一个节点为 `ongoing`，其余节点为 `pending`。
- 一条记录最多只能有一个 `ongoing` 节点。
- 节点通过后，当前节点变为 `passed`，下一个节点变为 `ongoing`。
- 最后一个节点通过后，记录视为已完成。
- 任意 `ongoing` 节点都可以被标记为 `terminated`。
- 出现 `terminated` 节点后，该记录视为已结束。
- `terminated` 节点之后的节点保持或重置为 `pending`。

#### 2.6 记录结束状态

原有 `Stage.ENDED` 和 `EndStatus` 不再作为流程节点存在。

记录结束由节点状态推导：

| 情况 | 记录状态 |
|------|----------|
| 存在 `terminated` 节点 | 已终止 |
| 所有节点均为 `passed` | 已完成 |
| 存在 `ongoing` 节点 | 进行中 |

为方便筛选和渲染，`InterviewRecord` 可冗余存储：

```typescript
isEnded: boolean
endReason?: 'completed' | 'terminated'
```

#### 2.7 详情页流程操作

详情页移除原有“当前阶段”下拉选择，改为流程节点操作区。

节点展示建议使用步骤条或时间线。

操作规则：

- `ongoing` 节点显示“通过”和“终止”按钮。
- 点击“通过”：当前节点变为 `passed`，下一个节点变为 `ongoing`；如果没有下一个节点，记录变为已完成。
- 点击“终止”：当前节点变为 `terminated`，后续节点变为 `pending`。
- `passed` 节点显示“撤回到此节点”。
- `terminated` 节点显示“恢复到此节点”。
- 点击撤回或恢复后，该节点变为 `ongoing`，后续节点变为 `pending`。
- `pending` 节点默认不显示操作按钮。

---

### 需求 3：看板动态化

#### 3.1 功能描述

看板从固定列改为动态列，列来源于全局流程节点模板。

#### 3.2 展示规则

- 看板全局展示所有组记录。
- 不提供组筛选器。
- 只展示进行中的记录。
- 已完成和已终止的记录不在看板中展示。
- 每一列对应一个全局模板节点。
- 记录展示在其当前 `ongoing` 节点对应的列中。
- 记录卡片中展示：公司名、岗位名、所属组名。

#### 3.3 模板快照与看板列匹配

由于已有记录使用快照，可能出现记录中的节点名称不再存在于全局模板中的情况。

处理规则：

- 看板列以当前全局模板为准。
- 如果记录当前 `ongoing` 节点的 `templateId` 仍存在于全局模板，则展示到对应列。
- 如果对应模板已被删除，则展示到“其他流程”兜底列。
- “其他流程”列仅在存在这类记录时显示。

---

### 需求 4：删除技术面自评分

删除原有技术面自评分功能。

改动范围：

- `Round` 类型移除 `selfRating?: number`。
- `RoundForm` 删除自评分表单项。
- `RecordDetail` 删除自评分展示。
- 历史数据中的 `selfRating` 字段不做迁移，读取时忽略。

---

### 需求 5：删除面经链接

删除原有面经链接功能。

改动范围：

- `InterviewRecord` 类型移除 `interviewDocUrl?: string`。
- `updateRecord` 不再支持更新 `interviewDocUrl`。
- 详情页删除面经链接编辑和展示区域。
- 历史数据中的 `interviewDocUrl` 字段不做迁移，读取时忽略。

---

### 需求 6：日历增强

#### 6.1 事件展示时间

日历事件展示格式改为：

```text
公司名 · 轮次类型 · HH:mm
```

示例：

```text
字节跳动 · 技术面 · 14:00
```

#### 6.2 日期 hover 详情

鼠标悬停到某个日期格子时，展示当天所有面试的详细信息。

详情内容包括：

- 日期。
- 公司名。
- 岗位名。
- 所属组名。
- 轮次类型。
- 技术面轮次号（如有）。
- 面试时间。
- 面试形式。
- 面试时长（如有）。

实现建议：使用 Ant Design `Popover`，`trigger="hover"`。

---

### 需求 7：数据导入 / 导出

#### 7.1 导出

在顶部导航或设置页提供“导出数据”按钮。

导出内容包括：

- `stageTemplates`
- `groups`
- `records`
- 数据版本号
- 导出时间

导出文件名：

```text
offer-track-export-YYYY-MM-DD.json
```

#### 7.2 导入

提供“导入数据”按钮。

导入流程：

1. 用户选择 `.json` 文件。
2. 系统校验 JSON 格式。
3. 校验通过后弹出二次确认。
4. 用户确认后覆盖当前本地数据。
5. 导入完成后刷新页面或重新加载 store。

导入提示文案：

```text
导入将覆盖当前所有本地数据，请确认你已提前导出备份。
```

#### 7.3 数据格式

```json
{
  "version": "2.0",
  "exportedAt": "2026-04-30T12:00:00.000Z",
  "stageTemplates": [],
  "groups": [],
  "records": []
}
```

---

### 需求 8：应用内关闭后台服务

#### 8.1 功能描述

当前项目运行时需要一直保留命令行窗口。本次重构后，改为通过脚本隐藏启动服务，并在应用内提供“关闭应用”按钮。

#### 8.2 实现方案

不引入 Electron，新增一个极简本地 Node 服务：

- `server.mjs` 负责提供静态文件服务。
- `server.mjs` 暴露 `POST /api/shutdown`。
- 前端点击“关闭应用”按钮后调用该接口。
- 服务收到请求后延迟短暂时间执行 `process.exit(0)`。

#### 8.3 启动脚本

新增或改造启动脚本：

- 构建前端产物。
- 隐藏窗口启动 `node server.mjs`。
- 自动打开浏览器访问本地地址。

建议访问地址：

```text
http://localhost:5173
```

#### 8.4 数据存储

数据仍存储在浏览器 localStorage 中，不迁移为文件存储。

用户数据安全通过导入 / 导出功能保障。

---

## 四、数据模型总览

重构后核心数据模型建议如下。

```typescript
type StageNodeStatus = 'pending' | 'ongoing' | 'passed' | 'terminated'

type EndReason = 'completed' | 'terminated'

interface Group {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface StageTemplate {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

interface StageNode {
  id: string
  templateId: string
  name: string
  order: number
  status: StageNodeStatus
}

interface Round {
  id: string
  type: RoundType
  techRoundNumber?: number
  format: InterviewFormat
  scheduledAt: string
  duration?: number
}

interface InterviewRecord {
  id: string
  groupId: string
  companyName: string
  position: string
  createdAt: string
  updatedAt: string
  stageNodes: StageNode[]
  isEnded: boolean
  endReason?: EndReason
  rounds: Round[]
}
```

---

## 五、Store 能力要求

`useRecordStore` 需要支持以下能力。

### 5.1 分组

```typescript
addGroup(name: string): void
renameGroup(id: string, name: string): void
deleteGroup(id: string): boolean
getGroupById(id: string): Group | undefined
```

`deleteGroup` 规则：

- 默认组返回失败。
- 组内有记录返回失败。
- 只有空组允许删除。

### 5.2 节点模板

```typescript
addStageTemplate(name: string): void
renameStageTemplate(id: string, name: string): void
deleteStageTemplate(id: string): boolean
reorderStageTemplates(ids: string[]): void
```

模板变更只影响新建记录。

### 5.3 记录

```typescript
addRecord(groupId: string, companyName: string, position: string): void
deleteRecord(id: string): void
updateRecord(id: string, fields: Partial<Pick<InterviewRecord, 'companyName' | 'position' | 'groupId'>>): void
getRecordById(id: string): InterviewRecord | undefined
```

### 5.4 流程节点操作

```typescript
passStageNode(recordId: string, nodeId: string): void
terminateStageNode(recordId: string, nodeId: string): void
rollbackToStageNode(recordId: string, nodeId: string): void
```

### 5.5 轮次

```typescript
addRound(recordId: string, round: Omit<Round, 'id'>): void
deleteRound(recordId: string, roundId: string): void
```

### 5.6 导入导出

```typescript
exportData(): ExportPayload
importData(payload: ExportPayload): void
```

---

## 六、页面与组件改造范围

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/types/index.ts` | 大改 | 重构数据模型 |
| `src/store/useRecordStore.ts` | 大改 | 新增 Group、StageTemplate、节点操作、导入导出 |
| `src/pages/Settings/index.tsx` | 新增 | 全局节点模板管理 |
| `src/pages/Settings/Settings.module.css` | 新增 | 设置页样式 |
| `src/pages/RecordList/index.tsx` | 大改 | 组 Tab、组管理、分页、按组新增记录 |
| `src/pages/RecordList/RecordList.module.css` | 中改 | 分组和分页样式 |
| `src/pages/RecordDetail/index.tsx` | 大改 | 替换阶段下拉为节点操作区，删除面经链接、自评分展示 |
| `src/pages/Board/index.tsx` | 大改 | 动态列，全局展示所有组，支持其他流程兜底列 |
| `src/pages/Calendar/index.tsx` | 中改 | 时间展示、hover 详情、组名展示 |
| `src/components/StageProgress/index.tsx` | 大改 | 使用 StageNode 渲染状态颜色 |
| `src/components/RecordCard/index.tsx` | 中改 | 适配节点模型，展示组名、结束状态 |
| `src/components/RoundForm/index.tsx` | 小改 | 删除自评分 |
| `src/components/Layout/index.tsx` | 中改 | 新增设置入口、导入导出、关闭应用按钮 |
| `src/App.tsx` | 小改 | 新增 `/settings` 路由 |
| `server.mjs` | 新增 | 静态服务和关闭接口 |
| `start.bat` | 新增或改造 | 隐藏启动本地服务 |
| `package.json` | 小改 | 增加服务启动脚本 |

---

## 七、实施顺序

建议按以下顺序实施：

1. 数据模型重构：`types/index.ts`。
2. Store 重构：Group、StageTemplate、Record、StageNode 操作。
3. 数据迁移逻辑：兼容 v1.0 localStorage 数据。
4. 删除自评分和面经链接。
5. 新增设置页：节点模板管理。
6. 改造记录列表：组 Tab、组管理、分页、新增记录归组。
7. 改造详情页：节点流程操作。
8. 改造记录卡片和进度条。
9. 改造看板：动态列、全局记录、其他流程兜底列。
10. 改造日历：时间展示和 hover 详情。
11. 增加数据导入 / 导出。
12. 增加本地服务关闭能力：`server.mjs`、启动脚本、关闭按钮。
13. 全量构建和手动冒烟测试。

---

## 八、验收标准

### 8.1 面试组

- 可以新增、重命名、删除空组。
- 默认分组不能删除。
- 有记录的组不能删除。
- 记录可以归入指定组。
- 组内记录分页正常。
- 搜索、筛选、排序和分页联动正确。

### 8.2 动态流程节点

- 可以在设置页新增、重命名、删除、排序节点模板。
- 新建记录使用当前模板生成流程快照。
- 修改模板不影响已有记录。
- 详情页可以推进、终止、撤回流程节点。
- 节点颜色符合规则。

### 8.3 看板

- 看板按当前模板动态生成列。
- 看板展示所有组的进行中记录。
- 已完成、已终止记录不展示。
- 被删除模板对应的进行中记录展示在“其他流程”列。

### 8.4 日历

- 日历事件显示具体时间。
- 鼠标悬停日期时展示当天详细面试信息。
- 点击事件可以跳转记录详情页。

### 8.5 删除功能

- 详情页不再显示面经链接。
- 添加轮次时不再显示自评分。
- 轮次详情不再显示自评分。

### 8.6 导入导出

- 可以导出完整 JSON 数据。
- 可以导入符合格式的数据。
- 导入前有覆盖确认提示。
- 导入后页面数据正确刷新。

### 8.7 本地启动关闭

- 可以通过脚本隐藏启动应用。
- 应用内点击“关闭应用”后，本地服务进程退出。
- 不需要引入 Electron。

---

## 九、风险与注意事项

| 风险 | 说明 | 应对 |
|------|------|------|
| 数据模型变更较大 | Stage 枚举变为动态节点，影响面广 | 先完成类型和 Store，再逐页适配 |
| 历史数据兼容 | v1.0 数据没有 groupId、stageNodes | Store persist 需要版本迁移 |
| 模板快照和看板动态列冲突 | 历史记录可能引用已删除模板 | 增加“其他流程”兜底列 |
| localStorage 数据风险 | 用户清缓存会丢数据 | 增加导入导出功能 |
| 关闭应用接口 | 浏览器 dev server 下没有 `/api/shutdown` | 仅本地 Node 服务模式启用，开发模式失败时给出提示 |

---

## 十、暂不做事项

以下内容不在本次重构范围内：

- Electron / Tauri 桌面应用打包。
- 文件系统数据库或 SQLite 存储。
- 云同步。
- 多用户协作。
- 移动端专项适配。
- 面试提醒 / 系统通知。
