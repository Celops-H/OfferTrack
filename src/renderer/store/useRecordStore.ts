import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type {
  Group,
  StageTemplate,
  StageNode,
  InterviewRecord,
  RecordState,
  ExportPayload,
  StageNodeStatus,
} from '../types'
import {
  DEFAULT_TEMPLATES,
  DEFAULT_GROUP,
} from '../types'

const now = () => new Date().toISOString()

// 从模板生成节点快照
function createStageNodes(templates: StageTemplate[], selectedIds: string[]): StageNode[] {
  const selected = templates
    .filter((t) => selectedIds.includes(t.id))
    .sort((a, b) => a.order - b.order)

  return selected.map((t, i) => ({
    id: uuidv4(),
    templateId: t.id,
    name: t.name,
    order: i,
    status: (i === 0 ? 'ongoing' : 'pending') as StageNodeStatus,
  }))
}

// 推导记录结束状态
function recalculateEndState(nodes: StageNode[]): { isEnded: boolean; endReason?: 'completed' | 'terminated' } {
  const hasTerminated = nodes.some((n) => n.status === 'terminated')
  if (hasTerminated) return { isEnded: true, endReason: 'terminated' }

  const allPassed = nodes.every((n) => n.status === 'passed')
  if (allPassed) return { isEnded: true, endReason: 'completed' }

  return { isEnded: false }
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
      version: 1,
      groups: [],
      stageTemplates: [],
      records: [],

      // ---- 面试组 ----

      addGroup: (name: string) => {
        const group: Group = {
          id: uuidv4(),
          name,
          createdAt: now(),
          updatedAt: now(),
        }
        set((s) => ({ groups: [...s.groups, group] }))
      },

      renameGroup: (id: string, name: string) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, name, updatedAt: now() } : g)),
        }))
      },

      deleteGroup: (id: string) => {
        const { records } = get()
        if (id === DEFAULT_GROUP.id) return false
        if (records.some((r) => r.groupId === id)) return false
        set((s) => ({ groups: s.groups.filter((g) => g.id !== id) }))
        return true
      },

      // ---- 流程节点模板 ----

      addStageTemplate: (name: string) => {
        const { stageTemplates } = get()
        const maxOrder = stageTemplates.reduce((m, t) => Math.max(m, t.order), -1)
        const tpl: StageTemplate = {
          id: uuidv4(),
          name,
          order: maxOrder + 1,
          createdAt: now(),
          updatedAt: now(),
        }
        set((s) => ({ stageTemplates: [...s.stageTemplates, tpl] }))
      },

      renameStageTemplate: (id: string, name: string) => {
        set((s) => ({
          stageTemplates: s.stageTemplates.map((t) =>
            t.id === id ? { ...t, name, updatedAt: now() } : t,
          ),
        }))
      },

      deleteStageTemplate: (id: string) => {
        const { stageTemplates } = get()
        if (stageTemplates.length <= 1) return false
        set((s) => ({ stageTemplates: s.stageTemplates.filter((t) => t.id !== id) }))
        return true
      },

      reorderStageTemplates: (ids: string[]) => {
        set((s) => ({
          stageTemplates: s.stageTemplates
            .map((t) => {
              const idx = ids.indexOf(t.id)
              return idx >= 0 ? { ...t, order: idx, updatedAt: now() } : t
            })
            .sort((a, b) => a.order - b.order),
        }))
      },

      // ---- 记录 ----

      addRecord: (groupId: string, companyName: string, position: string, selectedTemplateIds: string[]) => {
        const { stageTemplates } = get()
        const nodes = createStageNodes(stageTemplates, selectedTemplateIds)
        const record: InterviewRecord = {
          id: uuidv4(),
          groupId,
          companyName,
          position,
          stageNodes: nodes,
          isEnded: false,
          createdAt: now(),
          updatedAt: now(),
        }
        set((s) => ({ records: [record, ...s.records] }))
      },

      deleteRecord: (id: string) => {
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }))
      },

      updateRecord: (id: string, fields: Partial<Pick<InterviewRecord, 'companyName' | 'position' | 'groupId'>>) => {
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, ...fields, updatedAt: now() } : r,
          ),
        }))
      },

      getRecordById: (id: string) => {
        return get().records.find((r) => r.id === id)
      },

      // ---- 流程节点操作 ----

      passStageNode: (recordId: string, nodeId: string) => {
        set((s) => ({
          records: s.records.map((r) => {
            if (r.id !== recordId) return r
            const nodes = r.stageNodes.map((n) =>
              n.id === nodeId ? { ...n, status: 'passed' as StageNodeStatus } : n,
            )
            const nextPending = nodes.find((n) => n.status === 'pending')
            if (nextPending) {
              nextPending.status = 'ongoing'
            }
            const endState = recalculateEndState(nodes)
            return { ...r, stageNodes: nodes, ...endState, updatedAt: now() }
          }),
        }))
      },

      terminateStageNode: (recordId: string, nodeId: string) => {
        set((s) => ({
          records: s.records.map((r) => {
            if (r.id !== recordId) return r
            const nodes = r.stageNodes.map((n) =>
              n.id === nodeId ? { ...n, status: 'terminated' as StageNodeStatus } : n,
            )
            return {
              ...r,
              stageNodes: nodes,
              isEnded: true,
              endReason: 'terminated' as const,
              updatedAt: now(),
            }
          }),
        }))
      },

      rollbackToStageNode: (recordId: string, nodeId: string) => {
        set((s) => ({
          records: s.records.map((r) => {
            if (r.id !== recordId) return r
            let found = false
            const nodes = r.stageNodes.map((n) => {
              if (n.id === nodeId) {
                found = true
                return { ...n, status: 'ongoing' as StageNodeStatus }
              }
              if (found) return { ...n, status: 'pending' as StageNodeStatus }
              // 该节点之前的节点：ongoing/terminated → passed
              return (n.status === 'ongoing' || n.status === 'terminated')
                ? { ...n, status: 'passed' as StageNodeStatus }
                : n
            })
            return {
              ...r,
              stageNodes: nodes,
              isEnded: false,
              endReason: undefined,
              updatedAt: now(),
            }
          }),
        }))
      },

      // ---- 节点排期 ----

      updateStageNodeSchedule: (recordId: string, nodeId: string, schedule: { scheduledAt?: string; format?: 'video' | 'onsite' | 'phone'; duration?: number }) => {
        set((s) => ({
          records: s.records.map((r) => {
            if (r.id !== recordId) return r
            return {
              ...r,
              stageNodes: r.stageNodes.map((n) =>
                n.id === nodeId ? { ...n, ...schedule } : n,
              ),
              updatedAt: now(),
            }
          }),
        }))
      },

      // ---- 导入导出 ----

      exportData: () => {
        const { stageTemplates, groups, records } = get()
        return {
          version: '2.0',
          exportedAt: now(),
          stageTemplates,
          groups,
          records,
        }
      },

      importData: (payload: ExportPayload) => {
        if (!payload.version || !payload.stageTemplates || !payload.groups || !payload.records) {
          throw new Error('导入数据格式无效')
        }
        set({
          stageTemplates: payload.stageTemplates,
          groups: payload.groups,
          records: payload.records,
        })
      },
    }),
    {
      name: 'offer-track-storage',
      version: 1,
      migrate: (persisted: unknown) => {
        const old = persisted as Record<string, unknown> & { records?: Array<Record<string, unknown>> }
        if (old.records && !old.groups && !old.stageTemplates) {
          const nowStr = now()
          const defaultTemplates: StageTemplate[] = DEFAULT_TEMPLATES.map((t) => ({
            ...t,
            createdAt: nowStr,
            updatedAt: nowStr,
          }))
          const defaultGroup: Group = { ...DEFAULT_GROUP, createdAt: nowStr, updatedAt: nowStr }

          const migratedRecords: InterviewRecord[] = (old.records || []).map((r) => {
            const stage = r.stage as string
            const endStatus = r.endStatus as string | undefined

            const nodes: StageNode[] = defaultTemplates.map((t, i) => {
              let status: StageNodeStatus = 'pending'
              const stageOrder: Record<string, number> = {
                screening: 0,
                technical: 1,
                hr: 2,
                offer: 3,
              }
              const stageIdx = stageOrder[stage] ?? 0

              if (stage === 'ended') {
                if (endStatus === 'offered') {
                  status = 'passed'
                } else if (i === stageOrder['offer']) {
                  status = 'terminated'
                } else if (i < stageOrder['offer']) {
                  status = 'passed'
                }
              } else {
                if (i < stageIdx) status = 'passed'
                else if (i === stageIdx) status = 'ongoing'
              }

              return {
                id: uuidv4(),
                templateId: t.id,
                name: t.name,
                order: i,
                status,
              }
            })

            const endState = recalculateEndState(nodes)

            return {
              id: (r.id as string) || uuidv4(),
              groupId: defaultGroup.id,
              companyName: (r.companyName as string) || '',
              position: (r.position as string) || '',
              stageNodes: nodes,
              isEnded: endState.isEnded,
              endReason: endState.endReason,
              createdAt: (r.createdAt as string) || nowStr,
              updatedAt: (r.updatedAt as string) || nowStr,
            }
          })

          return {
            version: 1,
            groups: [defaultGroup],
            stageTemplates: defaultTemplates,
            records: migratedRecords,
          }
        }
        return { version: 1, ...(old as object) } as RecordState
      },
    },
  ),
)
