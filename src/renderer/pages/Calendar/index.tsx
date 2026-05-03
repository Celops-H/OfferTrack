import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Popover, Typography, Badge } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Solar, Lunar } from 'lunar-javascript'
import { useRecordStore } from '../../store/useRecordStore'
import { INTERVIEW_FORMAT_LABEL } from '../../types'
import styles from './Calendar.module.css'

const { Text } = Typography

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

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

interface DayInfo {
  date: dayjs.Dayjs
  dayNum: number
  isCurrentMonth: boolean
  isToday: boolean
  lunarText: string
  isJieQi: boolean
  events: CalendarEvent[]
}

export default function Calendar() {
  const navigate = useNavigate()
  const { groups, records } = useRecordStore()
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const containerRef = useRef<HTMLDivElement>(null)

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

  const getLunarInfo = useCallback((date: dayjs.Dayjs): { text: string; isJieQi: boolean } => {
    try {
      const solar = Solar.fromYmd(date.year(), date.month() + 1, date.date())
      const lunar = solar.getLunar()

      // 节气优先
      const jieQi = lunar.getJieQi()
      if (jieQi) return { text: jieQi, isJieQi: true }

      // 公历节日
      const solarFestivals = solar.getFestivals()
      if (solarFestivals.length > 0) return { text: solarFestivals[0], isJieQi: false }

      // 农历节日
      const lunarFestivals = lunar.getFestivals()
      if (lunarFestivals.length > 0) return { text: lunarFestivals[0], isJieQi: false }

      // 农历初一显示月名，否则显示日名
      const dayInChinese = lunar.getDayInChinese()
      if (dayInChinese === '初一') {
        return { text: lunar.getMonthInChinese() + '月', isJieQi: false }
      }
      return { text: dayInChinese, isJieQi: false }
    } catch {
      return { text: '', isJieQi: false }
    }
  }, [])

  const days = useMemo((): DayInfo[] => {
    const year = currentMonth.year()
    const month = currentMonth.month()
    const startOfMonth = currentMonth.startOf('month')
    const endOfMonth = currentMonth.endOf('month')
    const startDayOfWeek = startOfMonth.day() // 0=Sun
    const daysInMonth = endOfMonth.date()
    const today = dayjs()

    const result: DayInfo[] = []

    // 填充前置空白（上月末尾）
    for (let i = 0; i < startDayOfWeek; i++) {
      const d = startOfMonth.subtract(startDayOfWeek - i, 'day')
      result.push({
        date: d,
        dayNum: d.date(),
        isCurrentMonth: false,
        isToday: d.isSame(today, 'day'),
        lunarText: '',
        isJieQi: false,
        events: [],
      })
    }

    // 当月日期
    for (let i = 1; i <= daysInMonth; i++) {
      const d = currentMonth.date(i)
      const dateKey = d.format('YYYY-MM-DD')
      const lunar = getLunarInfo(d)
      result.push({
        date: d,
        dayNum: i,
        isCurrentMonth: true,
        isToday: d.isSame(today, 'day'),
        lunarText: lunar.text,
        isJieQi: lunar.isJieQi,
        events: eventsByDate.get(dateKey) || [],
      })
    }

    // 填充后置空白（下月开头），凑满 6 行
    const remaining = 42 - result.length
    const lastDay = endOfMonth
    for (let i = 1; i <= remaining; i++) {
      const d = lastDay.add(i, 'day')
      result.push({
        date: d,
        dayNum: d.date(),
        isCurrentMonth: false,
        isToday: d.isSame(today, 'day'),
        lunarText: '',
        isJieQi: false,
        events: [],
      })
    }

    return result
  }, [currentMonth, eventsByDate, getLunarInfo])

  const goToPrevMonth = () => setCurrentMonth((m) => m.subtract(1, 'month'))
  const goToNextMonth = () => setCurrentMonth((m) => m.add(1, 'month'))
  const goToToday = () => setCurrentMonth(dayjs())

  // 滑轮切换月份
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) goToPrevMonth()
      else goToNextMonth()
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  const renderEventPopover = (date: dayjs.Dayjs, events: CalendarEvent[]) => {
    if (events.length === 0) return null
    return (
      <div className={styles.popoverContent}>
        <div className={styles.popoverDate}>{date.format('YYYY年M月D日')}</div>
        {events.map((ev, i) => (
          <div key={i} className={styles.popoverItem}>
            <div className={styles.popoverCompany}>
              {ev.companyName} · {ev.position}
            </div>
            <div className={styles.popoverMeta}>所属：{ev.groupName}</div>
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
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* 月份切换栏 */}
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={goToPrevMonth}>
          <LeftOutlined />
        </button>
        <div className={styles.monthTitle} onClick={goToToday}>
          {currentMonth.year()}年 {currentMonth.month() + 1}月
        </div>
        <button className={styles.navBtn} onClick={goToNextMonth}>
          <RightOutlined />
        </button>
        <button className={styles.todayBtn} onClick={goToToday}>今天</button>
      </div>

      {/* 周标题 */}
      <div className={styles.weekdayRow}>
        {WEEKDAYS.map((name) => (
          <div key={name} className={styles.weekdayCell}>
            {name}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className={styles.grid}>
        {days.map((day, idx) => {
          const hasEvents = day.events.length > 0

          const cell = (
            <div
              key={idx}
              className={[
                styles.cell,
                !day.isCurrentMonth && styles.cellOtherMonth,
                day.isToday && styles.cellToday,
              ].filter(Boolean).join(' ')}
            >
              <span className={[
                styles.dayNum,
                day.isToday && styles.dayNumToday,
              ].filter(Boolean).join(' ')}>
                {day.dayNum}
              </span>
              {day.lunarText && (
                <span className={[
                  styles.lunarText,
                  day.isJieQi && styles.jieQi,
                ].filter(Boolean).join(' ')}>
                  {day.lunarText}
                </span>
              )}
              {hasEvents && (
                <div className={styles.eventDots}>
                  {day.events.slice(0, 4).map((ev, i) => (
                    <span
                      key={i}
                      className={styles.eventDot}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/record/${ev.recordId}`)
                      }}
                      title={`${ev.companyName} · ${ev.nodeName} · ${dayjs(ev.scheduledAt).format('HH:mm')}`}
                    />
                  ))}
                  {day.events.length > 4 && (
                    <span className={styles.eventMore}>+{day.events.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          )

          if (hasEvents) {
            return (
              <Popover key={idx} content={renderEventPopover(day.date, day.events)} trigger="hover" placement="right">
                {cell}
              </Popover>
            )
          }
          return cell
        })}
      </div>
    </div>
  )
}
