import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Input, Select, Modal, Checkbox, Pagination, Empty } from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useRecordStore } from '../../store/useRecordStore'
import type { StageTemplate } from '../../types'
import RecordCard from '../../components/RecordCard'
import styles from './RecordList.module.css'

export default function RecordList() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()

  const { groups, stageTemplates, records, addRecord, deleteRecord } = useRecordStore()
  const group = groups.find((g) => g.id === groupId)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 新增记录弹窗
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addCompanyName, setAddCompanyName] = useState('')
  const [addPosition, setAddPosition] = useState('')
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])

  const filteredRecords = useMemo(() => {
    let list = records.filter((r) => r.groupId === groupId)
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase()
      list = list.filter((r) => r.companyName.toLowerCase().includes(keyword))
    }
    if (statusFilter === 'ongoing') list = list.filter((r) => !r.isEnded)
    else if (statusFilter === 'ended') list = list.filter((r) => r.isEnded)
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [records, groupId, searchText, statusFilter])

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, page, pageSize])

  const handleAdd = () => {
    if (!addCompanyName.trim() || !addPosition.trim() || !groupId || selectedTemplateIds.length === 0) return
    addRecord(groupId, addCompanyName.trim(), addPosition.trim(), selectedTemplateIds)
    setAddCompanyName('')
    setAddPosition('')
    setSelectedTemplateIds([])
    setAddModalOpen(false)
  }

  const sortedTemplates = [...stageTemplates].sort((a, b) => a.order - b.order)

  if (!group) {
    return <Empty description="面试组不存在" />
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
          返回
        </Button>
        <h2 className={styles.groupTitle}>{group.name}</h2>
      </div>

      <div className={styles.toolbar}>
        <Input.Search
          placeholder="搜索公司名"
          allowClear
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPage(1) }}
          style={{ width: 240 }}
        />
        <Select
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部' },
            { value: 'ongoing', label: '进行中' },
            { value: 'ended', label: '已结束' },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
          新增记录
        </Button>
      </div>

      {filteredRecords.length === 0 ? (
        <Empty description="暂无记录" style={{ marginTop: 80 }} />
      ) : (
        <>
          <div className={styles.list}>
            {paginatedRecords.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onDelete={deleteRecord}
                onClick={(id) => navigate(`/record/${id}`)}
              />
            ))}
          </div>
          <div className={styles.pagination}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={filteredRecords.length}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
              onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
              showTotal={(total) => `共 ${total} 条`}
            />
          </div>
        </>
      )}

      <Modal
        title="新增记录"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => setAddModalOpen(false)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: selectedTemplateIds.length === 0 }}
      >
        <div className={styles.formFields}>
          <Input
            placeholder="公司名称"
            value={addCompanyName}
            onChange={(e) => setAddCompanyName(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <Input
            placeholder="岗位名称"
            value={addPosition}
            onChange={(e) => setAddPosition(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div className={styles.templateSelect}>
            <div className={styles.templateLabel}>选择流程节点：</div>
            <Checkbox.Group
              value={selectedTemplateIds}
              onChange={(values) => setSelectedTemplateIds(values as string[])}
            >
              <div className={styles.checkboxList}>
                {sortedTemplates.map((t: StageTemplate) => (
                  <Checkbox key={t.id} value={t.id}>{t.name}</Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </div>
        </div>
      </Modal>
    </div>
  )
}
