import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button, Input, Select, Space, Typography, Descriptions, Empty, Result, Divider, Popconfirm, Modal
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useRecordStore } from '../../store/useRecordStore'
import { INTERVIEW_FORMAT_LABEL } from '../../types'
import StageProgress from '../../components/StageProgress'
import styles from './RecordDetail.module.css'

const { Title, Text } = Typography

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { groups, records, updateRecord, deleteRecord, passStageNode, terminateStageNode, rollbackToStageNode, updateStageNodeSchedule } = useRecordStore()

  const record = records.find((r) => r.id === id)

  const [editingField, setEditingField] = useState<'companyName' | 'position' | null>(null)
  const [editValue, setEditValue] = useState('')

  // 节点排期编辑
  const [schedulingNodeId, setSchedulingNodeId] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState<{ scheduledAt: string; format: 'video' | 'onsite' | 'phone'; duration: number }>({ scheduledAt: '', format: 'video', duration: 0 })

  if (!record) {
    return (
      <Result
        status="404"
        title="记录不存在"
        extra={<Button type="primary" onClick={() => navigate('/')}>返回列表</Button>}
      />
    )
  }

  const startEdit = (field: 'companyName' | 'position') => {
    setEditingField(field)
    setEditValue(record[field] ?? '')
  }

  const confirmEdit = () => {
    if (editingField) {
      updateRecord(record.id, { [editingField]: editValue.trim() })
      setEditingField(null)
    }
  }

  const handleDelete = () => {
    deleteRecord(record.id)
    navigate(-1)
  }

  // 打开排期编辑
  const openSchedule = (nodeId: string) => {
    const node = record.stageNodes.find((n) => n.id === nodeId)
    if (node) {
      setSchedulingNodeId(nodeId)
      setScheduleForm({
        scheduledAt: node.scheduledAt || '',
        format: node.format || 'video',
        duration: node.duration || 0,
      })
    }
  }

  const saveSchedule = () => {
    if (schedulingNodeId) {
      updateStageNodeSchedule(record.id, schedulingNodeId, {
        scheduledAt: scheduleForm.scheduledAt || undefined,
        format: scheduleForm.format,
        duration: scheduleForm.duration || undefined,
      })
      setSchedulingNodeId(null)
    }
  }

  // 有排期的节点
  const scheduledNodes = record.stageNodes.filter((n) => n.scheduledAt)

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Popconfirm title="确认删除该记录？" onConfirm={handleDelete} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
          <Button danger>删除记录</Button>
        </Popconfirm>
      </div>

      {/* 基本信息区 */}
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <Text type="secondary" className={styles.infoLabel}>公司名</Text>
          {editingField === 'companyName' ? (
            <Space>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ width: 200 }} autoFocus onPressEnter={confirmEdit} />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={confirmEdit} />
              <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingField(null)} />
            </Space>
          ) : (
            <Space>
              <Title level={4} style={{ margin: 0 }}>{record.companyName}</Title>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit('companyName')} />
            </Space>
          )}
        </div>

        <div className={styles.infoRow}>
          <Text type="secondary" className={styles.infoLabel}>岗位</Text>
          {editingField === 'position' ? (
            <Space>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ width: 200 }} autoFocus onPressEnter={confirmEdit} />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={confirmEdit} />
              <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingField(null)} />
            </Space>
          ) : (
            <Space>
              <Text strong>{record.position}</Text>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit('position')} />
            </Space>
          )}
        </div>

        <div className={styles.infoRow}>
          <Text type="secondary" className={styles.infoLabel}>所属组</Text>
          <Select
            value={record.groupId}
            onChange={(value) => updateRecord(record.id, { groupId: value })}
            style={{ width: 200 }}
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
          />
        </div>

        <Descriptions size="small" style={{ marginTop: 8 }}>
          <Descriptions.Item label="创建时间">{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="最近更新">{dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      {/* 面试流程区 */}
      <div className={styles.section}>
        <Title level={5}>面试流程</Title>
        <div className={styles.progressArea}>
          <StageProgress
            nodes={record.stageNodes}
            detailMode
            onPass={(nodeId) => passStageNode(record.id, nodeId)}
            onTerminate={(nodeId) => terminateStageNode(record.id, nodeId)}
            onRollback={(nodeId) => rollbackToStageNode(record.id, nodeId)}
            onRestore={(nodeId) => rollbackToStageNode(record.id, nodeId)}
          />
        </div>
      </div>

      <Divider />

      {/* 节点排期区 */}
      <div className={styles.section}>
        <Title level={5}>节点排期</Title>
        {scheduledNodes.length === 0 ? (
          <Empty description="暂无排期，点击流程中的节点圆点后可设置排期" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className={styles.scheduleList}>
            {scheduledNodes
              .sort((a, b) => a.order - b.order)
              .map((node) => (
                <div key={node.id} className={styles.scheduleItem}>
                  <span className={styles.scheduleNodeName}>{node.name}</span>
                  <span className={styles.scheduleInfo}>
                    {node.scheduledAt ? dayjs(node.scheduledAt).format('YYYY-MM-DD HH:mm') : '未设置时间'}
                    {node.format && ` · ${INTERVIEW_FORMAT_LABEL[node.format]}`}
                    {node.duration ? ` · ${node.duration}分钟` : ''}
                  </span>
                  <Button type="link" size="small" onClick={() => openSchedule(node.id)}>编辑</Button>
                </div>
              ))}
          </div>
        )}
        {/* 也可以为已通过/进行中节点添加排期 */}
        <div className={styles.addScheduleHint}>
          {record.stageNodes
            .filter((n) => !n.scheduledAt && (n.status === 'ongoing' || n.status === 'passed'))
            .sort((a, b) => a.order - b.order)
            .map((n) => (
              <Button key={n.id} type="dashed" size="small" onClick={() => openSchedule(n.id)} style={{ marginRight: 8, marginBottom: 8 }}>
                为「{n.name}」添加排期
              </Button>
            ))}
        </div>
      </div>

      {/* 排期编辑弹窗 */}
      <Modal
        title="编辑节点排期"
        open={!!schedulingNodeId}
        onOk={saveSchedule}
        onCancel={() => setSchedulingNodeId(null)}
        okText="保存"
        cancelText="取消"
      >
        <div className={styles.scheduleForm}>
          <label>面试时间</label>
          <Input
            type="datetime-local"
            value={scheduleForm.scheduledAt ? dayjs(scheduleForm.scheduledAt).format('YYYY-MM-DDTHH:mm') : ''}
            onChange={(e) => {
              const v = e.target.value
              setScheduleForm((f) => ({ ...f, scheduledAt: v ? new Date(v).toISOString() : '' }))
            }}
            style={{ marginBottom: 12 }}
          />
          <label>面试形式</label>
          <Select
            value={scheduleForm.format}
            onChange={(v) => setScheduleForm((f) => ({ ...f, format: v }))}
            style={{ width: '100%', marginBottom: 12 }}
            options={[
              { value: 'video', label: '视频' },
              { value: 'onsite', label: '现场' },
              { value: 'phone', label: '电话' },
            ]}
          />
          <label>时长（分钟）</label>
          <Input
            type="number"
            value={scheduleForm.duration || ''}
            onChange={(e) => setScheduleForm((f) => ({ ...f, duration: Number(e.target.value) || 0 }))}
            placeholder="60"
          />
        </div>
      </Modal>
    </div>
  )
}
