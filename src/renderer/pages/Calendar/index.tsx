import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as AntCalendar, Popover, Typography, Badge } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useRecordStore } from '../../store/useRecordStore'
import { INTERVIEW_FORMAT_LABEL } from '../../types'
import styles from './Calendar.module.css'

const { Text } = Typography

interface CalendarEvent {
  recordId: string
  companyName: string
  position: string
  groupName: string
  nodeName: string
  scheduledAt: string
  format?: string
  duration?: number
}

export default function Calendar() {
  const navigate = useNavigate()
  const { groups, records } = useRecordStore()

  // 从有排期的节点构建事件
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    records.forEach((r) => {
      const group = groups.find((g) => g.id === r.groupId)
      r.stageNodes
        .filter((n) => n.scheduledAt)
        .forEach((n) => {
          const dateKey = dayjs(n.scheduledAt).format('YYYY-MM-DD')
          if (!map.has(dateKey)) map.set(dateKey, [])
          map.get(dateKey)!.push({
            recordId: r.id,
            companyName: r.companyName,
            position: r.position,
            groupName: group?.name || '',
            nodeName: n.name,
            scheduledAt: n.scheduledAt!,
            format: n.format,
            duration: n.duration,
          })
        })
    })
    return map
  }, [records, groups])

  const cellRender = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD')
    const events = eventsByDate.get(key) || []

    if (events.length === 0) {
      return <div className={styles.cell}>{date.date()}</div>
    }

    const popoverContent = (
      <div className={styles.popoverContent}>
        <div className={styles.popoverDate}>{date.format('YYYY年M月D日')}</div>
        {events.map((ev, i) => (
          <div key={i} className={styles.popoverItem}>
            <div className={styles.popoverCompany}>
              {ev.companyName} · {ev.position}
            </div>
            <div className={styles.popoverMeta}>
              所属：{ev.groupName}
            </div>
            <div className={styles.popoverMeta}>
              {ev.nodeName}
              {ev.format && ` · ${INTERVIEW_FORMAT_LABEL[ev.format as keyof typeof INTERVIEW_FORMAT_LABEL] || ev.format}`}
            </div>
            <div className={styles.popoverMeta}>
              时间：{dayjs(ev.scheduledAt).format('HH:mm')}
              {ev.duration ? ` · 时长：${ev.duration}分钟` : ''}
            </div>
          </div>
        ))}
      </div>
    )

    return (
      <Popover content={popoverContent} trigger="hover" placement="right">
        <div className={styles.cell}>
          <div className={styles.dateNum}>{date.date()}</div>
          {events.slice(0, 3).map((ev, i) => (
            <div
              key={i}
              className={styles.event}
              onClick={() => navigate(`/record/${ev.recordId}`)}
            >
              <Badge status="processing" />
              <span className={styles.eventText}>
                {ev.companyName} · {ev.nodeName} · {dayjs(ev.scheduledAt).format('HH:mm')}
              </span>
            </div>
          ))}
          {events.length > 3 && (
            <Text type="secondary" style={{ fontSize: 11 }}>+{events.length - 3} 更多</Text>
          )}
        </div>
      </Popover>
    )
  }

  return (
    <div className={styles.container}>
      <AntCalendar cellRender={cellRender} />
    </div>
  )
}
