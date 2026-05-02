import { useNavigate } from 'react-router-dom'
import { Typography, Empty } from 'antd'
import { useRecordStore } from '../../store/useRecordStore'
import { Stage, STAGE_LABEL, STAGE_ORDER } from '../../types'
import styles from './Board.module.css'

const { Title, Text } = Typography

export default function Board() {
  const navigate = useNavigate()
  const { records } = useRecordStore()

  // 仅展示进行中的记录
  const activeRecords = records.filter((r) => r.stage !== Stage.ENDED)

  // 按阶段分组
  const groupedByStage = STAGE_ORDER.reduce<Record<Stage, typeof activeRecords>>(
    (acc, stage) => {
      acc[stage] = activeRecords.filter((r) => r.stage === stage)
      return acc
    },
    {} as Record<Stage, typeof activeRecords>,
  )

  // 阶段标签颜色
  const STAGE_BORDER_COLOR: Record<Stage, string> = {
    [Stage.SCREENING]: '#91caff',
    [Stage.TECHNICAL]: '#ffc069',
    [Stage.HR]: '#d3adf7',
    [Stage.OFFER]: '#95de64',
    [Stage.ENDED]: '#d9d9d9',
  }

  return (
    <div className={styles.container}>
      <Title level={4} style={{ marginBottom: 20 }}>看板</Title>

      {activeRecords.length === 0 && (
        <Empty description="暂无进行中的记录" style={{ marginTop: 80 }} />
      )}

      <div className={styles.board}>
        {STAGE_ORDER.map((stage) => {
          const stageRecords = groupedByStage[stage]
          return (
            <div
              key={stage}
              className={styles.column}
              style={{ borderTop: `3px solid ${STAGE_BORDER_COLOR[stage]}` }}
            >
              <div className={styles.columnHeader}>
                <Text strong>{STAGE_LABEL[stage]}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>（{stageRecords.length}）</Text>
              </div>

              {stageRecords.length === 0 ? (
                <div className={styles.emptySlot}>
                  <Text type="secondary" style={{ fontSize: 12 }}>暂无</Text>
                </div>
              ) : (
                <div className={styles.recordList}>
                  {stageRecords.map((r) => (
                    <div
                      key={r.id}
                      className={styles.recordItem}
                      onClick={() => navigate(`/record/${r.id}`)}
                    >
                      <Text strong style={{ display: 'block', fontSize: 13 }}>{r.companyName}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.position}</Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
