import type { StageNode } from '../../types'
import styles from './StageProgress.module.css'

interface Props {
  nodes: StageNode[]
}

export default function StageProgress({ nodes }: Props) {
  if (!nodes.length) return null

  const sorted = [...nodes].sort((a, b) => a.order - b.order)

  return (
    <div className={styles.container}>
      {sorted.map((node, index) => {
        const isPassed = node.status === 'passed'
        const isOngoing = node.status === 'ongoing'
        const isTerminated = node.status === 'terminated'

        // 判断是否全部通过（最后一个节点 passed 且无 ongoing/terminated）
        const allPassed = nodes.every((n) => n.status === 'passed')
        const isLastAndAllPassed = allPassed && index === sorted.length - 1

        // 连线颜色：左侧节点为 passed 时绿色，否则灰色
        const lineLeft = index > 0 ? sorted[index - 1] : null
        const lineGreen = lineLeft?.status === 'passed'

        // 圆点颜色
        let dotClass = styles.dotPending
        if (isPassed) dotClass = styles.dotPassed
        else if (isOngoing) dotClass = styles.dotOngoing
        else if (isTerminated) dotClass = styles.dotTerminated

        // 下方文字
        let statusText = ''
        let statusTextClass = ''
        if (isOngoing) {
          statusText = '进行中'
          statusTextClass = styles.textOngoing
        } else if (isTerminated) {
          statusText = '流程终止'
          statusTextClass = styles.textTerminated
        } else if (isLastAndAllPassed) {
          statusText = '流程结束'
          statusTextClass = styles.textCompleted
        }

        return (
          <div key={node.id} className={styles.stepWrap}>
            {/* 连线 */}
            {index > 0 && (
              <div className={`${styles.line} ${lineGreen ? styles.linePassed : styles.linePending}`} />
            )}
            {/* 节点名（圆点上方） */}
            <span className={styles.nodeName}>{node.name}</span>
            {/* 圆点 */}
            <div className={`${styles.dot} ${dotClass}`} />
            {/* 状态文字（圆点下方） */}
            <span className={`${styles.statusText} ${statusTextClass || ''}`}>
              {statusText || ' '}
            </span>
          </div>
        )
      })}
    </div>
  )
}
