import { Stage, EndStatus, STAGE_ORDER, STAGE_LABEL, END_STATUS_LABEL } from '../../types'
import styles from './StageProgress.module.css'

interface Props {
  stage: Stage
  endStatus?: EndStatus
}

export default function StageProgress({ stage, endStatus }: Props) {
  const isEnded = stage === Stage.ENDED

  // 当前激活的阶段索引
  const activeIndex = isEnded
    ? STAGE_ORDER.length
    : STAGE_ORDER.indexOf(stage)

  return (
    <div className={styles.container}>
      {STAGE_ORDER.map((s, index) => {
        const isPast = index < activeIndex
        const isCurrent = !isEnded && index === activeIndex

        return (
          <div key={s} className={styles.stepWrap}>
            {/* 连接线（第一个节点左侧不显示） */}
            {index > 0 && (
              <div className={`${styles.line} ${isPast || isEnded ? styles.lineDone : ''}`} />
            )}
            {/* 节点圆圈 */}
            <div
              className={`${styles.dot} ${isPast || isEnded ? styles.dotDone : ''} ${isCurrent ? styles.dotCurrent : ''}`}
            />
            {/* 节点标签 */}
            <span className={`${styles.label} ${isCurrent ? styles.labelCurrent : ''}`}>
              {STAGE_LABEL[s]}
            </span>
          </div>
        )
      })}

      {/* 已结束子状态 */}
      {isEnded && endStatus && (
        <div className={styles.endBadge}>
          {END_STATUS_LABEL[endStatus]}
        </div>
      )}
    </div>
  )
}
