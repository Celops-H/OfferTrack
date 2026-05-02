// 流程节点状态
export type StageNodeStatus = 'pending' | 'ongoing' | 'passed' | 'terminated'

// 记录结束原因
export type EndReason = 'completed' | 'terminated'

// 面试形式
export type InterviewFormat = 'video' | 'onsite' | 'phone'

// 面试组
export interface Group {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

// 全局流程节点模板
export interface StageTemplate {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

// 记录内流程节点快照
export interface StageNode {
  id: string
  templateId: string
  name: string
  order: number
  status: StageNodeStatus
  scheduledAt?: string
  format?: InterviewFormat
  duration?: number
}

// 公司面试记录
export interface InterviewRecord {
  id: string
  groupId: string
  companyName: string
  position: string
  stageNodes: StageNode[]
  isEnded: boolean
  endReason?: EndReason
  createdAt: string
  updatedAt: string
}

// 导出数据格式
export interface ExportPayload {
  version: string
  exportedAt: string
  stageTemplates: StageTemplate[]
  groups: Group[]
  records: InterviewRecord[]
}

// Store 状态
export interface RecordState {
  version: number
  groups: Group[]
  stageTemplates: StageTemplate[]
  records: InterviewRecord[]
}

// ---- 展示文本映射 ----

export const STAGE_NODE_STATUS_LABEL: Record<StageNodeStatus, string> = {
  pending: '未到达',
  ongoing: '进行中',
  passed: '已通过',
  terminated: '流程终止',
}

export const END_REASON_LABEL: Record<EndReason, string> = {
  completed: '流程结束',
  terminated: '流程终止',
}

export const INTERVIEW_FORMAT_LABEL: Record<InterviewFormat, string> = {
  video: '视频',
  onsite: '现场',
  phone: '电话',
}

// ---- 默认值 ----

export const DEFAULT_TEMPLATES: Omit<StageTemplate, 'createdAt' | 'updatedAt'>[] = [
  { id: 'tpl-resume', name: '简历筛选', order: 0 },
  { id: 'tpl-assessment', name: '测评', order: 1 },
  { id: 'tpl-tech', name: '技术面', order: 2 },
  { id: 'tpl-hr', name: 'HR面', order: 3 },
  { id: 'tpl-offer', name: 'Offer', order: 4 },
]

export const DEFAULT_GROUP: Omit<Group, 'createdAt' | 'updatedAt'> = {
  id: 'group-default',
  name: '默认分组',
}
