import { useState } from 'react'
import { Button, Input, Modal, Popconfirm, Space, List, Alert } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useRecordStore } from '../../store/useRecordStore'
import type { StageTemplate } from '../../types'
import styles from './Settings.module.css'

export default function Settings() {
  const { stageTemplates, records, addStageTemplate, renameStageTemplate, deleteStageTemplate, reorderStageTemplates } = useRecordStore()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (!addName.trim()) return
    addStageTemplate(addName.trim())
    setAddName('')
    setAddModalOpen(false)
  }

  const handleRename = (id: string) => {
    if (!editName.trim()) return
    renameStageTemplate(id, editName.trim())
    setEditingId(null)
  }

  const startEdit = (tpl: StageTemplate) => {
    setEditingId(tpl.id)
    setEditName(tpl.name)
  }

  const handleDelete = (id: string) => {
    if (!deleteStageTemplate(id)) return
  }

  const getUsageCount = (templateId: string) =>
    records.filter((r) => r.stageNodes.some((n) => n.templateId === templateId)).length

  const moveUp = (index: number) => {
    if (index === 0) return
    const ids = stageTemplates.map((t) => t.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    reorderStageTemplates(ids)
  }

  const moveDown = (index: number) => {
    if (index === stageTemplates.length - 1) return
    const ids = stageTemplates.map((t) => t.id)
    ;[ids[index + 1], ids[index]] = [ids[index], ids[index + 1]]
    reorderStageTemplates(ids)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>流程节点模板管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
          新增节点
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        message="模板变更仅影响后续新建记录，不影响已有记录"
        className={styles.alert}
      />

      <List
        dataSource={stageTemplates}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button
                key="up"
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => moveUp(index)}
              />,
              <Button
                key="down"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={index === stageTemplates.length - 1}
                onClick={() => moveDown(index)}
              />,
              editingId === item.id ? (
                <Space key="edit-actions">
                  <Button type="link" onClick={() => handleRename(item.id)}>确认</Button>
                  <Button type="link" onClick={() => setEditingId(null)}>取消</Button>
                </Space>
              ) : (
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => startEdit(item)}
                />
              ),
              <Popconfirm
                key="delete"
                title="删除节点模板"
                description={
                  stageTemplates.length <= 1
                    ? '至少保留 1 个节点模板'
                    : getUsageCount(item.id) > 0
                      ? `该节点正在被 ${getUsageCount(item.id)} 条记录使用，删除后不影响已有记录，但无法再用于新建记录。`
                      : '确定删除该节点模板？'
                }
                onConfirm={() => handleDelete(item.id)}
                okText="确认删除"
                cancelText="取消"
                disabled={stageTemplates.length <= 1}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={stageTemplates.length <= 1}
                />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={
                editingId === item.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onPressEnter={() => handleRename(item.id)}
                    autoFocus
                    style={{ width: 200 }}
                  />
                ) : (
                  <span>
                    {item.name}
                    {getUsageCount(item.id) > 0 && (
                      <span className={styles.usage}> · {getUsageCount(item.id)} 条记录使用</span>
                    )}
                  </span>
                )
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="新增流程节点"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => { setAddModalOpen(false); setAddName('') }}
        okText="确认"
        cancelText="取消"
      >
        <Input
          placeholder="节点名称，如：简历筛选、测评、技术面"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          onPressEnter={handleAdd}
        />
      </Modal>
    </div>
  )
}
