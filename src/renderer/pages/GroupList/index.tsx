import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Modal, Input, Button, Dropdown, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined, FolderOutlined } from '@ant-design/icons'
import { useRecordStore } from '../../store/useRecordStore'
import { DEFAULT_GROUP } from '../../types'
import type { Group } from '../../types'
import styles from './GroupList.module.css'

export default function GroupList() {
  const navigate = useNavigate()
  const { groups, records, addGroup, renameGroup, deleteGroup } = useRecordStore()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editName, setEditName] = useState('')

  const getRecordCount = (groupId: string) =>
    records.filter((r) => r.groupId === groupId).length

  const handleAdd = () => {
    if (!addName.trim()) return
    addGroup(addName.trim())
    setAddName('')
    setAddModalOpen(false)
  }

  const handleRename = () => {
    if (!editingGroup || !editName.trim()) return
    renameGroup(editingGroup.id, editName.trim())
    setEditingGroup(null)
  }

  const handleDelete = (group: Group) => {
    deleteGroup(group.id)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>面试组</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
          新建面试组
        </Button>
      </div>

      {groups.length === 0 ? (
        <Empty description="暂无面试组，点击上方按钮创建" />
      ) : (
        <div className={styles.grid}>
          {groups.map((group) => {
            const count = getRecordCount(group.id)
            const isDefault = group.id === DEFAULT_GROUP.id
            const canDelete = !isDefault && count === 0

            return (
              <Card
                key={group.id}
                className={styles.groupCard}
                hoverable
                onClick={() => navigate(`/group/${group.id}`)}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardTop}>
                    <FolderOutlined className={styles.folderIcon} />
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'rename',
                            label: '重命名',
                            icon: <EditOutlined />,
                            onClick: (e) => {
                              e.domEvent.stopPropagation()
                              setEditingGroup(group)
                              setEditName(group.name)
                            },
                          },
                          {
                            key: 'delete',
                            label: isDefault ? '默认组不可删除' : count > 0 ? `组内有 ${count} 条记录，不可删除` : '删除',
                            icon: <DeleteOutlined />,
                            danger: true,
                            disabled: !canDelete,
                            onClick: (e) => {
                              e.domEvent.stopPropagation()
                              if (canDelete) handleDelete(group)
                            },
                          },
                        ],
                      }}
                      trigger={['click']}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.moreBtn}
                      />
                    </Dropdown>
                  </div>
                  <div className={styles.groupName}>
                    {group.name}
                    {isDefault && <span className={styles.defaultTag}>默认</span>}
                  </div>
                  <div className={styles.recordCount}>{count} 条记录</div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* 新增弹窗 */}
      <Modal
        title="新建面试组"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => { setAddModalOpen(false); setAddName('') }}
        okText="确认"
        cancelText="取消"
      >
        <Input
          placeholder="面试组名称，如：26年日常实习"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          onPressEnter={handleAdd}
        />
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名"
        open={!!editingGroup}
        onOk={handleRename}
        onCancel={() => setEditingGroup(null)}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onPressEnter={handleRename}
        />
      </Modal>
    </div>
  )
}
