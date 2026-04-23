# OfferTrack 架构决策文档（ADR）

| 项目 | 内容 |
|------|------|
| 产品名称 | OfferTrack |
| 文档版本 | v1.0 |
| 创建日期 | 2026-04-23 |
| 最近更新 | 2026-04-23 |

---

## 1. 架构总览

OfferTrack 采用**纯前端单页应用（SPA）架构**，无后端服务，数据持久化在浏览器本地存储中。

```
┌─────────────────────────────────────────────┐
│                  浏览器                      │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │           React SPA                   │  │
│  │                                       │  │
│  │  ┌─────────┐  ┌──────────────────┐   │  │
│  │  │  路由层   │  │    UI 组件层      │   │  │
│  │  │  React   │  │   Ant Design 5   │   │  │
│  │  │  Router  │  │                  │   │  │
│  │  └────┬────┘  └────────┬─────────┘   │  │
│  │       │                │              │  │
│  │  ┌────▼────────────────▼─────────┐   │  │
│  │  │        状态管理层              │   │  │
│  │  │     Zustand + persist         │   │  │
│  │  └────────────┬──────────────────┘   │  │
│  │               │                       │  │
│  │  ┌────────────▼──────────────────┐   │  │
│  │  │       持久化层                 │   │  │
│  │  │      localStorage             │   │  │
│  │  └───────────────────────────────┘   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 2. 技术选型

### 2.1 前端框架：React 18 + TypeScript

**决策理由：**
- 生态成熟，社区资源丰富
- TypeScript 提供类型安全，面试记录的数据模型较明确，类型约束有实际价值
- 日历、看板等场景有丰富的现成组件可用

**备选方案：** Vue 3 + TypeScript（同样可行，未选择是因为 React 生态在组件库丰富度上略有优势）

### 2.2 构建工具：Vite

**决策理由：**
- 开发服务器启动速度极快（<1秒），适合本产品「双击脚本即用」的使用方式
- 零配置开箱即用
- HMR 热更新体验好

### 2.3 UI 组件库：Ant Design 5

**决策理由：**
- 表格、表单、日历（Calendar）、标签（Tag）、卡片（Card）、下拉选择（Select）等组件直接覆盖产品需求
- 内置 Calendar 组件支持月视图和自定义日期单元格渲染，可直接用于日历视图
- 中文友好，文档完善

**备选方案：** Shadcn/ui（更现代美观，但需要手动组合更多，日历等复合组件需要额外引入）

### 2.4 路由：React Router v6

**决策理由：**
- 本产品共 4 个页面（记录列表、看板、日历、公司详情），路由结构简单
- React Router 是 React 生态下的事实标准

### 2.5 状态管理：Zustand

**决策理由：**
- API 极简，学习成本低
- 内置 `persist` 中间件，一行配置实现 localStorage 持久化
- 相比 Redux 轻量很多，本产品的状态复杂度不需要 Redux

**备选方案：** React Context（也够用，但 Zustand 在状态读写和持久化上更清晰）

### 2.6 数据持久化：localStorage

**决策理由：**
- 个人工具，数据量极小（几十到几百条记录），localStorage 5MB 上限完全够用
- 配合 Zustand persist 中间件，实现成本为零
- 无需搭建后端和数据库

**备选方案：** IndexedDB（数据量大时才需要，对本产品属于过度设计）

**风险：** 清除浏览器缓存会导致数据丢失。可通过后续添加 JSON 导入/导出功能作为备份手段缓解。

### 2.7 日期处理：dayjs

**决策理由：**
- Ant Design 5 内置依赖 dayjs，无需额外安装
- 轻量（2KB），API 与 moment.js 兼容

---

## 3. 路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 记录列表 | 主页，应用入口 |
| `/board` | 看板视图 | 按阶段分布查看 |
| `/calendar` | 日历视图 | 月视图查看面试安排 |
| `/record/:id` | 公司详情页 | 单条记录详情，id 为记录唯一标识 |

---

## 4. 数据模型

### 4.1 公司记录（Record）

```typescript
interface Record {
  id: string;                  // UUID
  companyName: string;         // 公司名
  position: string;            // 岗位名称
  stage: Stage;                // 当前阶段
  endStatus?: EndStatus;       // 结束子状态（仅 stage 为「已结束」时有值）
  interviewDocUrl?: string;    // 面经外链
  createdAt: string;           // 创建时间 ISO 8601
  updatedAt: string;           // 最近更新时间 ISO 8601
  rounds: Round[];             // 面试轮次列表
}
```

### 4.2 阶段枚举（Stage）

```typescript
enum Stage {
  SCREENING = 'screening',       // 简历筛选中
  TECHNICAL = 'technical',       // 技术面
  HR = 'hr',                     // HR面
  OFFER = 'offer',               // Offer阶段
  ENDED = 'ended',               // 已结束
}
```

### 4.3 结束子状态枚举（EndStatus）

```typescript
enum EndStatus {
  OFFERED = 'offered',           // 已拿 Offer
  REJECTED = 'rejected',         // 挂
  DECLINED = 'declined',         // 已拒
}
```

### 4.4 面试轮次（Round）

```typescript
interface Round {
  id: string;                    // UUID
  type: RoundType;               // 轮次类型
  techRoundNumber?: number;      // 技术面轮次号（仅 type 为 TECHNICAL 时）
  format: InterviewFormat;       // 面试形式
  scheduledAt: string;           // 面试时间 ISO 8601
  duration?: number;             // 时长（分钟）
  selfRating?: number;           // 自我评分 1-5
}
```

### 4.5 轮次类型枚举（RoundType）

```typescript
enum RoundType {
  WRITTEN = 'written',           // 笔试
  TECHNICAL = 'technical',       // 技术面
  HR = 'hr',                     // HR面
  OTHER = 'other',               // 其他
}
```

### 4.6 面试形式枚举（InterviewFormat）

```typescript
enum InterviewFormat {
  VIDEO = 'video',               // 视频
  ONSITE = 'onsite',             // 现场
  PHONE = 'phone',               // 电话
}
```

---

## 5. 目录结构

```
interview-record/
├── public/
├── src/
│   ├── assets/                  # 静态资源
│   ├── components/              # 通用组件
│   │   ├── Layout/              # 布局组件（顶部导航）
│   │   ├── RecordCard/          # 记录卡片组件
│   │   ├── StageProgress/       # 流程节点进度条组件
│   │   └── RoundForm/           # 轮次录入表单组件
│   ├── pages/                   # 页面组件
│   │   ├── RecordList/          # 记录列表（主页）
│   │   ├── Board/               # 看板视图
│   │   ├── Calendar/            # 日历视图
│   │   └── RecordDetail/        # 公司详情页
│   ├── store/                   # Zustand 状态管理
│   │   └── useRecordStore.ts    # 记录数据 store
│   ├── types/                   # TypeScript 类型定义
│   │   └── index.ts             # 数据模型类型
│   ├── utils/                   # 工具函数
│   ├── App.tsx                  # 根组件 + 路由配置
│   └── main.tsx                 # 应用入口
├── PRD.md                       # 产品需求文档
├── ADR.md                       # 架构决策文档（本文件）
├── package.json
├── tsconfig.json
├── vite.config.ts
├── start.bat                    # Windows 启动脚本
└── README.md
```

---

## 6. 启动与部署

### 6.1 开发环境

```bash
npm install    # 首次安装依赖
npm run dev    # 启动开发服务器（http://localhost:5173）
```

### 6.2 日常使用

双击项目根目录下的 `start.bat` 脚本，自动启动开发服务器并打开浏览器：

```bat
@echo off
cd /d c:\develop\WorkSpace\projects\interview-record
start http://localhost:5173
npm run dev
```

### 6.3 生产构建

```bash
npm run build  # 输出到 dist/ 目录
```

纯静态文件，可部署到 GitHub Pages / Vercel / Netlify 等任意静态托管平台。

---

## 7. 后续扩展考虑

| 方向 | 方案 |
|------|------|
| 数据备份 | 添加 JSON 导入/导出功能，防止 localStorage 数据丢失 |
| 移动端 | 响应式适配或 PWA |
| 内置面经编辑器 | 集成 Markdown 编辑器（如 @bytemd/react） |
| 数据迁移到后端 | Zustand store 层抽象，切换持久化实现即可，UI 层无需改动 |
