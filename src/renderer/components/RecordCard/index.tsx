import { Card, Tag, Button, Popconfirm, Typography } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { InterviewRecord } from '../../types'
import { useRecordStore } from '../../store/useRecordStore'
import StageProgress from '../StageProgress'
import styles from './RecordCard.module.css'

const { Text } = Typography

interface Props {
  record: InterviewRecord
  onDelete: (id: string) => void
  onClick: (id: string) => void
}

export default function RecordCard({ record, onDelete, onClick }: Props) {
  const groups = useRecordStore((s) => s.groups)
  const group = groups.find((g) => g.id === record.groupId)

  return (
    <Card
      className={`${styles.card} ${record.isEnded ? styles.ended : ''}`}
      styles={{ body: { padding: '16px 20px' } }}
      hoverable={!record.isEnded}
      onClick={(e) => {
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
        {record.endReason && (
          <Tag color={record.endReason === 'completed' ? 'success' : 'error'}>
            {record.endReason === 'completed' ? '流程结束' : '流程终止'}
          </Tag>
        )}
      </div>

      <div className={styles.progress}>
        <StageProgress nodes={record.stageNodes} />
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {group && <Tag>{group.name}</Tag>}
        </div>
        <div className={styles.footerRight}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(record.updatedAt).format('YYYY-MM-DD')}
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
      </div>
    </Card>
  )
}
