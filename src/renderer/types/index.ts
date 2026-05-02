// 面试阶段枚举
export enum Stage {
  SCREENING = 'screening',   // 简历筛选中
  TECHNICAL = 'technical',   // 技术面
  HR = 'hr',                 // HR面
  OFFER = 'offer',           // Offer阶段
  ENDED = 'ended',           // 已结束
}

// 结束子状态枚举
export enum EndStatus {
  OFFERED = 'offered',       // 已拿 Offer
  REJECTED = 'rejected',     // 挂
  DECLINED = 'declined',     // 已拒
}

// 轮次类型枚举
export enum RoundType {
  WRITTEN = 'written',       // 笔试
  TECHNICAL = 'technical',   // 技术面
  HR = 'hr',                 // HR面
  OTHER = 'other',           // 其他
}

// 面试形式枚举
export enum InterviewFormat {
  VIDEO = 'video',           // 视频
  ONSITE = 'onsite',         // 现场
  PHONE = 'phone',           // 电话
}

// 面试轮次
export interface Round {
  id: string
  type: RoundType
  techRoundNumber?: number   // 仅技术面时填写
  format: InterviewFormat
  scheduledAt: string        // ISO 8601
  duration?: number          // 分钟
  selfRating?: number        // 1-5
}

// 公司面试记录
export interface InterviewRecord {
  id: string
  companyName: string
  position: string
  stage: Stage
  endStatus?: EndStatus
  interviewDocUrl?: string
  createdAt: string          // ISO 8601
  updatedAt: string          // ISO 8601
  rounds: Round[]
}

// 阶段展示文本
export const STAGE_LABEL: Record<Stage, string> = {
  [Stage.SCREENING]: '简历筛选中',
  [Stage.TECHNICAL]: '技术面',
  [Stage.HR]: 'HR面',
  [Stage.OFFER]: 'Offer阶段',
  [Stage.ENDED]: '已结束',
}

// 结束子状态展示文本
export const END_STATUS_LABEL: Record<EndStatus, string> = {
  [EndStatus.OFFERED]: '已拿 Offer',
  [EndStatus.REJECTED]: '挂',
  [EndStatus.DECLINED]: '已拒',
}

// 轮次类型展示文本
export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  [RoundType.WRITTEN]: '笔试',
  [RoundType.TECHNICAL]: '技术面',
  [RoundType.HR]: 'HR面',
  [RoundType.OTHER]: '其他',
}

// 面试形式展示文本
export const INTERVIEW_FORMAT_LABEL: Record<InterviewFormat, string> = {
  [InterviewFormat.VIDEO]: '视频',
  [InterviewFormat.ONSITE]: '现场',
  [InterviewFormat.PHONE]: '电话',
}

// 主流程阶段顺序（不含已结束）
export const STAGE_ORDER: Stage[] = [
  Stage.SCREENING,
  Stage.TECHNICAL,
  Stage.HR,
  Stage.OFFER,
]
