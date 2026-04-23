import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button, Input, Select, Collapse, Rate, Popconfirm,
  Typography, Descriptions, Space, Empty, Result, Divider
} from 'antd'
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  LinkOutlined, EditOutlined, CheckOutlined, CloseOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useRecordStore } from '../../store/useRecordStore'
import {
  Stage, EndStatus, RoundType,
  STAGE_LABEL, END_STATUS_LABEL, ROUND_TYPE_LABEL, INTERVIEW_FORMAT_LABEL,
  STAGE_ORDER
} from '../../types'
import RoundForm from '../../components/RoundForm'
import StageProgress from '../../components/StageProgress'
import styles from './RecordDetail.module.css'

const { Title, Text, Link } = Typography
const { Panel } = Collapse

// 阶段下拉选项（含已结束子状态）
const STAGE_OPTIONS = [
  ...STAGE_ORDER.map((s) => ({ value: s, label: STAGE_LABEL[s] })),
  { value: `${Stage.ENDED}:${EndStatus.OFFERED}`, label: `已结束·${END_STATUS_LABEL[EndStatus.OFFERED]}` },
  { value: `${Stage.ENDED}:${EndStatus.REJECTED}`, label: `已结束·${END_STATUS_LABEL[EndStatus.REJECTED]}` },
  { value: `${Stage.ENDED}:${EndStatus.DECLINED}`, label: `已结束·${END_STATUS_LABEL[EndStatus.DECLINED]}` },
]

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRecordById, updateRecord, updateStage, addRound, deleteRound } = useRecordStore()

  const record = getRecordById(id!)
  const [roundFormOpen, setRoundFormOpen] = useState(false)

  // 行内编辑状态
  const [editingField, setEditingField] = useState<'companyName' | 'position' | 'interviewDocUrl' | null>(null)
  const [editValue, setEditValue] = useState('')

  if (!record) {
    return (
      <Result
        status="404"
        title="记录不存在"
        subTitle="该记录可能已被删除"
        extra={<Button type="primary" onClick={() => navigate('/')}>返回列表</Button>}
      />
    )
  }

  // 获取当前阶段对应的下拉值
  const currentStageValue = record.stage === Stage.ENDED && record.endStatus
    ? `${record.stage}:${record.endStatus}`
    : record.stage

  const handleStageChange = (value: string) => {
    if (value.includes(':')) {
      const [stage, endStatus] = value.split(':')
      updateStage(record.id, stage as Stage, endStatus as EndStatus)
    } else {
      updateStage(record.id, value as Stage)
    }
  }

  const startEdit = (field: 'companyName' | 'position' | 'interviewDocUrl') => {
    setEditingField(field)
    setEditValue(record[field] ?? '')
  }

  const confirmEdit = () => {
    if (editingField) {
      updateRecord(record.id, { [editingField]: editValue.trim() })
      setEditingField(null)
    }
  }

  const cancelEdit = () => setEditingField(null)

  // 轮次排序（按面试时间从早到晚）
  const sortedRounds = [...record.rounds].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )

  const getRoundTitle = (round: typeof record.rounds[number]) => {
    const typeName = ROUND_TYPE_LABEL[round.type]
    const roundNum = round.type === RoundType.TECHNICAL && round.techRoundNumber
      ? ` 第${round.techRoundNumber}轮` : ''
    const format = INTERVIEW_FORMAT_LABEL[round.format]
    const time = dayjs(round.scheduledAt).format('MM-DD HH:mm')
    return `${typeName}${roundNum} · ${format} · ${time}`
  }

  return (
    <div className={styles.container}>
      {/* 返回导航 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className={styles.backBtn}
      >
        返回
      </Button>

      {/* 基本信息区 */}
      <div className={styles.infoCard}>
        {/* 公司名 */}
        <div className={styles.infoRow}>
          <Text type="secondary" className={styles.infoLabel}>公司名</Text>
          {editingField === 'companyName' ? (
            <Space>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ width: 200 }} autoFocus onPressEnter={confirmEdit} />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={confirmEdit} />
              <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
            </Space>
          ) : (
            <Space>
              <Title level={4} style={{ margin: 0 }}>{record.companyName}</Title>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit('companyName')} />
            </Space>
          )}
        </div>

        {/* 岗位 */}
        <div className={styles.infoRow}>
          <Text type="secondary" className={styles.infoLabel}>岗位</Text>
          {editingField === 'position' ? (
            <Space>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ width: 200 }} autoFocus onPressEnter={confirmEdit} />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={confirmEdit} />
              <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
            </Space>
          ) : (
            <Space>
              <Text strong>{record.position}</Text>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit('position')} />
            </Space>
          )}
        </div>

        {/* 当前阶段 */}
        <div className={styles.infoRow}>
          <Text type="secondary" className={styles.infoLabel}>当前阶段</Text>
          <Space direction="vertical" size={8}>
            <Select
              value={currentStageValue}
              onChange={handleStageChange}
              options={STAGE_OPTIONS}
              style={{ width: 200 }}
            />
            <StageProgress stage={record.stage} endStatus={record.endStatus} />
          </Space>
        </div>

        {/* 面经链接 */}
        <div className={styles.infoRow}>
          <Text type="secondary" className={styles.infoLabel}>面经链接</Text>
          {editingField === 'interviewDocUrl' ? (
            <Space>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ width: 300 }} placeholder="https://..." autoFocus onPressEnter={confirmEdit} />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={confirmEdit} />
              <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
            </Space>
          ) : (
            <Space>
              {record.interviewDocUrl
                ? <Link href={record.interviewDocUrl} target="_blank"><LinkOutlined /> {record.interviewDocUrl}</Link>
                : <Text type="secondary">未填写</Text>
              }
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit('interviewDocUrl')} />
            </Space>
          )}
        </div>

        <Descriptions size="small" style={{ marginTop: 8 }}>
          <Descriptions.Item label="创建时间">{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="最近更新">{dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      {/* 面试轮次区 */}
      <div className={styles.roundsSection}>
        <div className={styles.roundsHeader}>
          <Title level={5} style={{ margin: 0 }}>面试轮次（{record.rounds.length}）</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRoundFormOpen(true)}>
            添加轮次
          </Button>
        </div>

        {sortedRounds.length === 0 ? (
          <Empty description="暂无面试轮次，点击「添加轮次」记录" style={{ marginTop: 40 }} />
        ) : (
          <Collapse accordion className={styles.collapse}>
            {sortedRounds.map((round) => (
              <Panel
                key={round.id}
                header={getRoundTitle(round)}
                extra={
                  <Popconfirm
                    title="确认删除该轮次？"
                    onConfirm={(e) => { e?.stopPropagation(); deleteRound(record.id, round.id) }}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                }
              >
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="轮次类型">{ROUND_TYPE_LABEL[round.type]}</Descriptions.Item>
                  {round.type === RoundType.TECHNICAL && round.techRoundNumber && (
                    <Descriptions.Item label="技术面轮次">第 {round.techRoundNumber} 轮</Descriptions.Item>
                  )}
                  <Descriptions.Item label="面试形式">{INTERVIEW_FORMAT_LABEL[round.format]}</Descriptions.Item>
                  <Descriptions.Item label="面试时间">{dayjs(round.scheduledAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                  {round.duration && <Descriptions.Item label="时长">{round.duration} 分钟</Descriptions.Item>}
                  {round.selfRating && (
                    <Descriptions.Item label="自我评分">
                      <Rate disabled defaultValue={round.selfRating} count={5} />
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Panel>
            ))}
          </Collapse>
        )}
      </div>

      {/* 轮次录入表单 */}
      <RoundForm
        open={roundFormOpen}
        onCancel={() => setRoundFormOpen(false)}
        onSubmit={(round) => {
          addRound(record.id, round)
          setRoundFormOpen(false)
        }}
      />
    </div>
  )
}
