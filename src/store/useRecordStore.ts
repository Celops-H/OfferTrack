import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { InterviewRecord, Round, Stage, EndStatus } from '../types'

interface RecordState {
  records: InterviewRecord[]

  // 新增记录
  addRecord: (companyName: string, position: string) => void
  // 删除记录
  deleteRecord: (id: string) => void
  // 更新记录基本信息
  updateRecord: (id: string, fields: Partial<Pick<InterviewRecord, 'companyName' | 'position' | 'interviewDocUrl'>>) => void
  // 推进阶段
  updateStage: (id: string, stage: Stage, endStatus?: EndStatus) => void
  // 添加轮次
  addRound: (recordId: string, round: Omit<Round, 'id'>) => void
  // 删除轮次
  deleteRound: (recordId: string, roundId: string) => void
  // 获取单条记录
  getRecordById: (id: string) => InterviewRecord | undefined
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (companyName, position) => {
        const now = new Date().toISOString()
        const newRecord: InterviewRecord = {
          id: uuidv4(),
          companyName,
          position,
          stage: Stage.SCREENING,
          createdAt: now,
          updatedAt: now,
          rounds: [],
        }
        set((state) => ({ records: [newRecord, ...state.records] }))
      },

      deleteRecord: (id) => {
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }))
      },

      updateRecord: (id, fields) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...fields, updatedAt: new Date().toISOString() } : r,
          ),
        }))
      },

      updateStage: (id, stage, endStatus) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  stage,
                  endStatus: stage === Stage.ENDED ? endStatus : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : r,
          ),
        }))
      },

      addRound: (recordId, round) => {
        const newRound: Round = { id: uuidv4(), ...round }
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  rounds: [...r.rounds, newRound],
                  updatedAt: new Date().toISOString(),
                }
              : r,
          ),
        }))
      },

      deleteRound: (recordId, roundId) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  rounds: r.rounds.filter((round) => round.id !== roundId),
                  updatedAt: new Date().toISOString(),
                }
              : r,
          ),
        }))
      },

      getRecordById: (id) => {
        return get().records.find((r) => r.id === id)
      },
    }),
    {
      name: 'offer-track-records',
    },
  ),
)
