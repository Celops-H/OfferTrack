# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm install              # 安装依赖
npm run dev              # 启动 Vite 开发服务器（http://localhost:5173）
npm run build            # TypeScript 检查 + Vite 生产构建，输出到 dist/
npm run preview          # 预览生产构建
```

## 当前状态

**v1.0 代码 + v2.0 重构待开始。** 重构工作在 `refactor/v2.0` 分支上进行。

重构文档在 `docs/` 目录：

| 文档 | 内容 |
|------|------|
| `docs/PRD.md` | 产品需求 v2.0 |
| `docs/ADR.md` | 架构决策（Electron + React + Zustand） |
| `docs/PLAN.md` | 10 阶段执行计划 + Git 提交规范 |
| `docs/UI-SPEC.md` | UI 视觉规范（流程节点、看板、日历、卡片） |

重构核心变更：
- 引入 Electron 桌面应用
- 面试组（Group）管理
- 全局流程节点模板 + 记录内节点快照，替换固定 Stage 枚举
- 删除 Round/RoundType/面试轮次，排期信息直接放在 StageNode 上
- 删除面经链接（interviewDocUrl）和自评分（selfRating）
- 看板动态列 + 面试组筛选
- 日历时间展示 + hover Popover
- JSON 导入导出（Electron 原生对话框）

## v1.0 架构概览（当前代码）

纯前端 SPA，无后端。数据通过 Zustand `persist` 中间件存于 `localStorage`（key: `offer-track-storage`）。

```
App.tsx (React Router v6)
├── Layout（导航壳 + Outlet）
│   ├── /           → RecordList   （记录列表主页）
│   ├── /board      → Board        （看板）
│   └── /calendar   → Calendar     （日历）
└── /record/:id     → RecordDetail （记录详情，独立路由无 Layout）
```

**数据流：** 所有业务状态集中在 `src/store/useRecordStore.ts`，页面通过 store hooks 读写。

**v1.0 数据模型（v2.0 将全部替换）：**

```typescript
// 将删除
Stage = 'screening' | 'technical' | 'hr' | 'offer' | 'ended'
EndStatus = 'offered' | 'rejected' | 'declined'
RoundType = 'written' | 'technical' | 'hr' | 'other'
InterviewFormat = 'video' | 'onsite' | 'phone'

InterviewRecord {
  stage: Stage
  endStatus?: EndStatus
  interviewDocUrl?: string  // 删除
  rounds: Round[]           // 删除，排期移到 StageNode
}
```

## 开发规范

- 参考 ADR/PRD/PLAN 文档，不确定时向用户确认，使用 Git 规范开发
- 代码注释用中文
- 样式：CSS Modules + Ant Design 组件
- 类型：`src/types/index.ts` 是所有类型的单一来源
- 重构分支：`refactor/v2.0`，每阶段一个 commit，完成后合并到 `master`