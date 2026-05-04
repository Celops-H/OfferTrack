# OfferTrack v2.0 重构执行计划

| 项目 | 内容 |
|------|------|
| 产品名称 | OfferTrack |
| 文档版本 | v2.0 |
| 创建日期 | 2026-05-01 |
| 状态 | 待执行 |
| 分支 | `refactor/v2.0` |

---

## 1. 执行目标

从 v1.0 重构到 v2.0：

1. 引入 Electron 桌面应用架构。
2. 新增面试组，主页改为组卡片列表。
3. 全局流程节点模板 + 记录内节点快照，替换固定 Stage 枚举。
4. 删除 Round/RoundType，排期信息放在 StageNode 上。
5. 删除面经链接和自评分。
6. 节点三态颜色 + 文字（进行中 / 流程终止 / 流程结束）。
7. 看板动态列 + 面试组筛选。
8. 日历时间展示 + Popover hover 详情。
9. JSON 导入导出（Electron 原生对话框）。

---

## 2. 阶段总览（10 阶段）

```
阶段 0：Electron 项目搭建
    ↓
阶段 1：类型系统重构
    ↓
阶段 2：Store 重构 + 数据迁移
    ↓
阶段 3：设置页（节点模板管理）
    ↓
阶段 4：面试组 + 记录列表重构
    ↓
阶段 5：记录详情页流程节点重构
    ↓
阶段 6：看板 + 日历重构
    ↓
阶段 7：导入导出
    ↓
阶段 8：删除废弃代码清理
    ↓
阶段 9：验收与修复
```

---

## 3. 详细任务

### 阶段 0：Electron 项目搭建

| # | 任务 |
|---|------|
| 0.1 | 安装 `electron`、`electron-vite`、`electron-builder` |
| 0.2 | 创建 `electron/main.ts` 主进程入口 |
| 0.3 | 创建 `electron/preload.ts` 预加载脚本 |
| 0.4 | 创建 `electron.vite.config.ts` |
| 0.5 | 创建 `electron-builder.yml` |
| 0.6 | 调整 `package.json`：入口、scripts |
| 0.7 | 迁移 `src/` 为渲染进程代码 |
| 0.8 | 验证 `npm run dev` 可启动 Electron 窗口 |

---

### 阶段 1：类型系统重构

| # | 任务 |
|---|------|
| 1.1 | 新增 `Group`、`StageTemplate`、`StageNode`、`StageNodeStatus`、`EndReason`、`ExportPayload` |
| 1.2 | 重构 `InterviewRecord`：移除 `stage`、`endStatus`、`interviewDocUrl`、`rounds`，新增 `groupId`、`stageNodes`、`isEnded`、`endReason` |
| 1.3 | 删除 `Stage`、`EndStatus`、`RoundType`、`InterviewFormat`、`Round` 类型 |
| 1.4 | 新增默认模板和默认分组常量 |
| 1.5 | 保留并更新展示标签映射 |
| 1.6 | `npx tsc --noEmit` 通过 |

---

### 阶段 2：Store 重构 + 数据迁移

| # | 任务 |
|---|------|
| 2.1 | 重构 Store state：`groups`、`stageTemplates`、`records` |
| 2.2 | 面试组 CRUD：`addGroup`、`renameGroup`、`deleteGroup`（默认组/非空组保护） |
| 2.3 | 节点模板 CRUD + 排序：`addStageTemplate`、`renameStageTemplate`、`deleteStageTemplate`（至少保留 1 个）、`reorderStageTemplates` |
| 2.4 | `addRecord`：从模板选择节点生成快照，首个 `ongoing` |
| 2.5 | `deleteRecord` |
| 2.6 | `updateRecord`：公司名、岗位、所属组 |
| 2.7 | `passStageNode`：当前 → passed，下一 → ongoing，无下一则结束 |
| 2.8 | `terminateStageNode`：当前 → terminated，后续 → pending |
| 2.9 | `rollbackToStageNode`：目标 → ongoing，后续 → pending |
| 2.10 | `updateStageNodeSchedule`：设置节点排期（时间、形式、时长） |
| 2.11 | 内部 `recalculateEndState` |
| 2.12 | `getRecordById` |
| 2.13 | Zustand persist `version: 1` + `migrate`：v1.0 → v2.0 数据迁移 |
| 2.14 | 手动验证旧数据迁移 |

---

### 阶段 3：设置页（节点模板管理）

| # | 任务 |
|---|------|
| 3.1 | 创建 `pages/Settings/index.tsx` + CSS Module |
| 3.2 | 添加 `/settings` 路由 |
| 3.3 | Layout 导航添加"设置"入口 |
| 3.4 | 模板列表展示 |
| 3.5 | 新增节点（Modal + Input） |
| 3.6 | 重命名节点（行内编辑） |
| 3.7 | 删除节点（至少保留 1 个，提示使用中记录数） |
| 3.8 | 调整顺序（上移/下移） |
| 3.9 | 提示："模板变更仅影响后续新建记录" |

---

### 阶段 4：面试组 + 记录列表重构

#### 4.1 面试组列表（`/`）

| # | 任务 |
|---|------|
| 4.1.1 | 创建 `pages/GroupList/index.tsx` + CSS Module |
| 4.1.2 | 卡片网格展示所有组（组名 + 记录数） |
| 4.1.3 | 新增组弹窗 |
| 4.1.4 | 重命名组 |
| 4.1.5 | 删除空组（默认组/非空组保护） |
| 4.1.6 | 点击卡片进入 `/group/:groupId` |
| 4.1.7 | 空状态引导 |
| 4.1.8 | 更新路由：`/` → GroupList |

#### 4.2 组内记录列表（`/group/:groupId`）

| # | 任务 |
|---|------|
| 4.2.1 | 改造 `RecordList`：从 URL params 取 `groupId` |
| 4.2.2 | 顶部显示组名 + 返回按钮 |
| 4.2.3 | 新增记录：弹窗中从模板勾选节点并排序，自动归入当前组 |
| 4.2.4 | 状态筛选：全部 / 进行中 / 已结束 |
| 4.2.5 | 公司名搜索 + 更新时间倒序 |
| 4.2.6 | 分页：默认 10 条，支持 10/20/50，条件变更重置页码 |
| 4.2.7 | RecordCard 适配新 StageProgress + 组名 Tag |

---

### 阶段 5：记录详情页流程节点重构

| # | 任务 |
|---|------|
| 5.1 | 适配新 InterviewRecord 类型 |
| 5.2 | 基本信息区：公司名、岗位名行内编辑 + 所属组切换 |
| 5.3 | 重构 StageProgress：节点名在上、圆点──圆点、状态文字在下 |
| 5.4 | StageProgress 颜色：绿 passed / 蓝 ongoing / 红 terminated / 灰 pending |
| 5.5 | 当前节点下方文字：进行中 / 流程终止 / 流程结束 |
| 5.6 | `ongoing` 节点：显示 [通过] [终止] 按钮 |
| 5.7 | 点击 passed 节点：弹确认 → 撤回 |
| 5.8 | 点击 terminated 节点：弹确认 → 恢复 |
| 5.9 | 节点排期设置：当前或已通过节点可设置时间、形式、时长 |
| 5.10 | 移除面经链接、自评分、轮次列表 |

---

### 阶段 6：看板 + 日历重构

#### 6.1 看板

| # | 任务 |
|---|------|
| 6.1 | 顶部面试组筛选：[全部] + 各组名，默认"全部" |
| 6.2 | 列由 `stageTemplates` 动态生成 |
| 6.3 | 根据 `ongoing` 节点的 `templateId` 分组到对应列 |
| 6.4 | 记录卡片：公司名、岗位名、所属组名 |
| 6.5 | "其他流程"兜底列 |
| 6.6 | 已结束记录不展示 |

#### 6.2 日历

| # | 任务 |
|---|------|
| 6.7 | 事件来源：有 `scheduledAt` 的 StageNode |
| 6.8 | 自定义日历组件，支持农历/节气/节日显示 |
| 6.9 | 日期格内显示公司名，滚轮切换月份 |
| 6.10 | 中文周标题（日~六），仅显示当月日期 |
| 6.11 | Popover（trigger="hover"）展示日期详情 |
| 6.12 | 点击事件跳转详情页 |

---

### 阶段 7：导入导出

| # | 任务 |
|---|------|
| 7.1 | preload.ts 暴露 IPC 方法 |
| 7.2 | main.ts：dialog.showSaveDialog + fs.writeFile（导出） |
| 7.3 | main.ts：dialog.showOpenDialog + fs.readFile（导入） |
| 7.4 | Store：`exportData`、`importData`（校验 + 覆盖） |
| 7.5 | Layout 添加导入/导出按钮 |
| 7.6 | 导入前摘要 + 二次确认弹窗 |
| 7.7 | 非法数据错误提示 |

---

### 阶段 8：删除废弃代码清理

| # | 任务 |
|---|------|
| 8.1 | 删除 `components/RoundForm/` |
| 8.2 | 清理未使用的 import 和类型引用 |
| 8.3 | 确认无残留 Round/Stage/EndStatus 引用 |
| 8.4 | `npm run build` 通过 |

---

### 阶段 9：验收与修复

| # | 任务 |
|---|------|
| 9.1 | TypeScript 构建通过 |
| 9.2 | 手动验证面试组 CRUD |
| 9.3 | 手动验证模板 CRUD |
| 9.4 | 手动验证记录创建（选节点排序） |
| 9.5 | 手动验证节点推进、终止、撤回、恢复 |
| 9.6 | 手动验证看板 + 组筛选 + 兜底列 |
| 9.7 | 手动验证日历 hover + 时间展示 |
| 9.8 | 手动验证导入导出 |
| 9.9 | 手动验证 v1.0 旧数据迁移 |
| 9.10 | 手动验证 Electron 窗口启动/关闭 |

---

## 4. 关键依赖关系

```
阶段 0 (Electron) → 阶段 1 (类型) → 阶段 2 (Store)
    ↓                                    ↓
    └──────────── 所有 UI 阶段的前置 ──────────→ 阶段 3 4 5 6 7 → 8 → 9
```

阶段 3-7 在阶段 2 完成后可部分并行，阶段 8 清理在所有功能完成后执行。

---

## 5. Git 提交规范

在 `refactor/v2.0` 分支上，每阶段至少一个 commit：

| 阶段 | Commit Message |
|------|---------------|
| 0 | `feat: setup Electron project architecture` |
| 1 | `refactor: rebuild type system for v2.0` |
| 2 | `refactor: rebuild store with groups, templates, and data migration` |
| 3 | `feat: add settings page for stage template management` |
| 4 | `feat: add group list page and refactor record list` |
| 5 | `refactor: rebuild record detail with flow node operations` |
| 6 | `refactor: dynamic board columns and calendar enhancements` |
| 7 | `feat: add JSON import/export with Electron dialogs` |
| 8 | `chore: remove deprecated Round/RoundForm and unused code` |
| 9 | `fix: final build, polish, and bug fixes` |

全部完成后合并到 `master`。
