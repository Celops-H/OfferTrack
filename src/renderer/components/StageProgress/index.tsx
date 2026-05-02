import { Button, Popconfirm } from 'antd'
import type { StageNode } from '../../types'
import styles from './StageProgress.module.css'

interface Props {
  nodes: StageNode[]
  /** 是否为详情模式（显示操作按钮和交互） */
  detailMode?: boolean
  onPass?: (nodeId: string) => void
  onTerminate?: (nodeId: string) => void
  onRollback?: (nodeId: string) => void
  onRestore?: (nodeId: string) => void
}

export default function StageProgress({ nodes, detailMode, onPass, onTerminate, onRollback, onRestore }: Props) {
  if (!nodes.length) return null

  const sorted = [...nodes].sort((a, b) => a.order - b.order)
  const allPassed = nodes.every((n) => n.status === 'passed')

  return (
    <div className={styles.container}>
      {sorted.map((node, index) => {
        const isPassed = node.status === 'passed'
        const isOngoing = node.status === 'ongoing'
        const isTerminated = node.status === 'terminated'
        const isLastAndAllPassed = allPassed && index === sorted.length - 1

        const lineLeft = index > 0 ? sorted[index - 1] : null
        const lineGreen = lineLeft?.status === 'passed'

        let dotClass = styles.dotPending
        if (isPassed) dotClass = styles.dotPassed
        else if (isOngoing) dotClass = styles.dotOngoing
        else if (isTerminated) dotClass = styles.dotTerminated

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

        // 圆点是否可点击（详情模式下已通过或已终止的节点可点击撤回/恢复）
        const clickable = detailMode && (isPassed || isTerminated) && onRollback && onRestore

        return (
          <div key={node.id} className={styles.stepWrap}>
            {index > 0 && (
              <div className={`${styles.line} ${lineGreen ? styles.linePassed : styles.linePending}`} />
            )}
            <span className={styles.nodeName}>{node.name}</span>

            {/* 可点击的圆点用于回退/恢复 */}
            {clickable ? (
              <Popconfirm
                title={isPassed ? '撤回到此节点？' : '恢复到此节点？'}
                description={isPassed ? '后续节点将变为未到达状态' : '该节点将恢复为进行中'}
                onConfirm={() => isPassed ? onRollback(node.id) : onRestore(node.id)}
                okText="确认"
                cancelText="取消"
              >
                <div className={`${styles.dot} ${dotClass} ${styles.dotClickable}`} />
              </Popconfirm>
            ) : (
              <div className={`${styles.dot} ${dotClass}`} />
            )}

            <span className={`${styles.statusText} ${statusTextClass || ''}`}>
              {statusText || ' '}
            </span>

            {/* 详情模式下 ongoing 节点显示操作按钮 */}
            {detailMode && isOngoing && onPass && onTerminate && (
              <div className={styles.actions}>
                <Button size="small" type="primary" onClick={() => onPass(node.id)}>通过</Button>
                <Popconfirm
                  title="确认终止？"
                  description="流程将在此节点结束，后续节点不再进行"
                  onConfirm={() => onTerminate(node.id)}
                  okText="确认终止"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger>终止</Button>
                </Popconfirm>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
