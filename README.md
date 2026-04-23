# OfferTrack

面向密集求职期的个人面试进度管理工具，帮助你追踪与各公司的面试进程、记录每轮面试复盘，并从全局视角感知求职整体状态。

## 功能

- **记录列表**：新增/删除公司记录，按公司名搜索，按阶段筛选，按更新时间排序
- **看板视图**：按面试阶段分组展示进行中的公司，一眼掌握全局
- **日历视图**：月视图查看所有面试安排时间线
- **公司详情页**：行内编辑基本信息、推进面试阶段、管理面试轮次、记录面经外链

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| TypeScript | 5 | 类型安全 |
| Vite | 5 | 构建工具 |
| Ant Design | 5 | UI 组件库 |
| React Router | 6 | 客户端路由 |
| Zustand | 4 | 状态管理 + localStorage 持久化 |
| dayjs | 1 | 日期处理 |

## 快速开始

### 日常使用

双击项目根目录的 `start.bat`，自动启动开发服务器并打开浏览器。

### 手动启动

```bash
# 首次安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev
```

### 生产构建

```bash
npm run build
# 输出到 dist/ 目录，可部署到任意静态托管平台
```

## 数据存储

数据保存在浏览器 localStorage 中，无需后端。清除浏览器缓存会导致数据丢失，建议定期手动备份（后续版本将支持 JSON 导出）。

## 项目结构

```
src/
├── types/index.ts              # 枚举 & 数据模型
├── store/useRecordStore.ts     # Zustand store（含持久化）
├── components/
│   ├── Layout/                 # 顶部导航
│   ├── RecordCard/             # 记录卡片
│   ├── StageProgress/          # 流程进度条
│   └── RoundForm/              # 轮次录入表单
└── pages/
    ├── RecordList/             # 记录列表（主页）
    ├── RecordDetail/           # 公司详情页
    ├── Board/                  # 看板视图
    └── Calendar/               # 日历视图
```

## 面试阶段流程

```
简历筛选中 → 技术面 → HR面 → Offer阶段 → 已结束
                                           ├── 已拿 Offer
                                           ├── 挂
                                           └── 已拒
```
