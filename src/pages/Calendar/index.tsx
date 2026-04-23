import { useNavigate } from 'react-router-dom'
import { Calendar as AntCalendar, Badge, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useRecordStore } from '../../store/useRecordStore'
import { ROUND_TYPE_LABEL } from '../../types'
import styles from './Calendar.module.css'

const { Title } = Typography

interface CalendarEvent {
  recordId: string
  companyName: string
  roundTypeLabel: string
}

export default function Calendar() {
  const navigate = useNavigate()
  const { records } = useRecordStore()

  // 构建「日期 → 事件列表」的 Map
  const eventMap = new Map<string, CalendarEvent[]>()
  records.forEach((record) => {
    record.rounds.forEach((round) => {
      const dateKey = dayjs(round.scheduledAt).format('YYYY-MM-DD')
      const event: CalendarEvent = {
        recordId: record.id,
        companyName: record.companyName,
        roundTypeLabel: ROUND_TYPE_LABEL[round.type],
      }
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, [])
      }
      eventMap.get(dateKey)!.push(event)
    })
  })

  const dateCellRender = (value: Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD')
    const events = eventMap.get(dateKey) ?? []
    return (
      <ul className={styles.eventList}>
        {events.map((event, index) => (
          <li key={index}>
            <Badge
              status="processing"
              text={
                <span
                  className={styles.eventLabel}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/record/${event.recordId}`)
                  }}
                >
                  {event.companyName} · {event.roundTypeLabel}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={styles.container}>
      <Title level={4} style={{ marginBottom: 20 }}>日历</Title>
      <div className={styles.calendarWrap}>
        <AntCalendar cellRender={dateCellRender} />
      </div>
    </div>
  )
}
