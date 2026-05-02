import { Card, Tag, Button, Popconfirm, Typography } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { InterviewRecord, Stage, STAGE_LABEL, END_STATUS_LABEL } from '../../types'
import StageProgress from '../StageProgress'
import styles from './RecordCard.module.css'

const { Text } = Typography

interface Props {
  record: InterviewRecord
  onDelete: (id: string) => void
  onClick: (id: string) => void
}

// 阶段标签颜色
const STAGE_COLOR: Record<Stage, string> = {
  [Stage.SCREENING]: 'blue',
  [Stage.TECHNICAL]: 'orange',
  [Stage.HR]: 'purple',
  [Stage.OFFER]: 'green',
  [Stage.ENDED]: 'default',
}

function getStageTag(record: InterviewRecord) {
  if (record.stage === Stage.ENDED && record.endStatus) {
    const colorMap = { offered: 'success', rejected: 'error', declined: 'warning' } as const
    return <Tag color={colorMap[record.endStatus]}>{END_STATUS_LABEL[record.endStatus]}</Tag>
  }
  return <Tag color={STAGE_COLOR[record.stage]}>{STAGE_LABEL[record.stage]}</Tag>
}

export default function RecordCard({ record, onDelete, onClick }: Props) {
  const isEnded = record.stage === Stage.ENDED

  return (
    <Card
      className={`${styles.card} ${isEnded ? styles.ended : ''}`}
      styles={{ body: { padding: '16px 20px' } }}
      hoverable={!isEnded}
      onClick={(e) => {
        // 避免点击删除按钮时触发卡片跳转
        if ((e.target as HTMLElement).closest('.ant-popover, .ant-btn')) return
        onClick(record.id)
      }}
    >
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.company}>{record.companyName}</span>
          <span className={styles.separator}>·</span>
          <span className={styles.position}>{record.position}</span>
        </div>
        {getStageTag(record)}
      </div>

      <div className={styles.progress}>
        <StageProgress stage={record.stage} endStatus={record.endStatus} />
      </div>

      <div className={styles.footer}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          最近更新：{dayjs(record.updatedAt).format('YYYY-MM-DD')}
        </Text>
        <Popconfirm
          title="确认删除？"
          description="删除后无法恢复，确认删除该记录？"
          onConfirm={(e) => {
            e?.stopPropagation()
            onDelete(record.id)
          }}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          >
            删除
          </Button>
        </Popconfirm>
      </div>
    </Card>
  )
}
