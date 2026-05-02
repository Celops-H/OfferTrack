import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, Card, Tag, Empty } from 'antd'
import { useRecordStore } from '../../store/useRecordStore'
import styles from './Board.module.css'

export default function Board() {
  const navigate = useNavigate()
  const { groups, stageTemplates, records } = useRecordStore()
  const [groupFilter, setGroupFilter] = useState<string>('all')

  // 进行中的记录
  const activeRecords = useMemo(
    () => records.filter((r) => !r.isEnded),
    [records],
  )

  // 按面试组筛选
  const filteredRecords = useMemo(() => {
    if (groupFilter === 'all') return activeRecords
    return activeRecords.filter((r) => r.groupId === groupFilter)
  }, [activeRecords, groupFilter])

  // 按 ongoing 节点的 templateId 分组
  const columns = useMemo(() => {
    const sortedTemplates = [...stageTemplates].sort((a, b) => a.order - b.order)
    const templateIds = new Set(sortedTemplates.map((t) => t.id))
    const orphanRecords: typeof filteredRecords = []

    const colMap = new Map<string, typeof filteredRecords>()
    sortedTemplates.forEach((t) => colMap.set(t.id, []))

    filteredRecords.forEach((r) => {
      const ongoingNode = r.stageNodes.find((n) => n.status === 'ongoing')
      if (ongoingNode && templateIds.has(ongoingNode.templateId)) {
        const col = colMap.get(ongoingNode.templateId)
        col?.push(r)
      } else {
        orphanRecords.push(r)
      }
    })

    return {
      templateCols: sortedTemplates.map((t) => ({
        templateId: t.id,
        name: t.name,
        records: colMap.get(t.id) || [],
      })),
      orphanRecords,
    }
  }, [filteredRecords, stageTemplates])

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.filterLabel}>面试组：</span>
        <Select
          value={groupFilter}
          onChange={setGroupFilter}
          style={{ width: 180 }}
          options={[
            { value: 'all', label: '全部' },
            ...groups.map((g) => ({ value: g.id, label: g.name })),
          ]}
        />
      </div>

      <div className={styles.boardGrid}>
        {columns.templateCols.map((col) => (
          <div key={col.templateId} className={styles.column}>
            <div className={styles.columnHeader}>
              <span>{col.name}</span>
              <span className={styles.count}>{col.records.length}</span>
            </div>
            <div className={styles.columnBody}>
              {col.records.length === 0 ? (
                <div className={styles.emptyCol}>暂无</div>
              ) : (
                col.records.map((r) => {
                  const group = groups.find((g) => g.id === r.groupId)
                  return (
                    <Card
                      key={r.id}
                      className={styles.boardCard}
                      size="small"
                      hoverable
                      onClick={() => navigate(`/record/${r.id}`)}
                    >
                      <div className={styles.cardTitle}>{r.companyName}</div>
                      <div className={styles.cardPosition}>{r.position}</div>
                      {groupFilter === 'all' && group && (
                        <Tag style={{ marginTop: 4 }}>{group.name}</Tag>
                      )}
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        ))}

        {/* 其他流程兜底列 */}
        {columns.orphanRecords.length > 0 && (
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <span>其他流程</span>
              <span className={styles.count}>{columns.orphanRecords.length}</span>
            </div>
            <div className={styles.columnBody}>
              {columns.orphanRecords.map((r) => {
                const group = groups.find((g) => g.id === r.groupId)
                const ongoingNode = r.stageNodes.find((n) => n.status === 'ongoing')
                return (
                  <Card
                    key={r.id}
                    className={styles.boardCard}
                    size="small"
                    hoverable
                    onClick={() => navigate(`/record/${r.id}`)}
                  >
                    <div className={styles.cardTitle}>{r.companyName}</div>
                    <div className={styles.cardPosition}>{r.position}</div>
                    <div className={styles.orphanNode}>
                      {ongoingNode ? `当前: ${ongoingNode.name}` : ''}
                    </div>
                    {groupFilter === 'all' && group && (
                      <Tag style={{ marginTop: 4 }}>{group.name}</Tag>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {columns.templateCols.length === 0 && columns.orphanRecords.length === 0 && (
          <Empty description="暂无进行中的记录" style={{ gridColumn: '1 / -1', marginTop: 80 }} />
        )}
      </div>
    </div>
  )
}
