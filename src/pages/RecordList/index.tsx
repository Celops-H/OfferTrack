import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Modal, Form, Empty, Typography } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useRecordStore } from '../../store/useRecordStore'
import { Stage, EndStatus, STAGE_LABEL, END_STATUS_LABEL } from '../../types'
import RecordCard from '../../components/RecordCard'
import styles from './RecordList.module.css'

const { Title } = Typography

// 筛选选项：全部 + 各进行中阶段 + 已结束子状态
const FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: Stage.SCREENING, label: STAGE_LABEL[Stage.SCREENING] },
  { value: Stage.TECHNICAL, label: STAGE_LABEL[Stage.TECHNICAL] },
  { value: Stage.HR, label: STAGE_LABEL[Stage.HR] },
  { value: Stage.OFFER, label: STAGE_LABEL[Stage.OFFER] },
  { value: `${Stage.ENDED}:${EndStatus.OFFERED}`, label: `已结束·${END_STATUS_LABEL[EndStatus.OFFERED]}` },
  { value: `${Stage.ENDED}:${EndStatus.REJECTED}`, label: `已结束·${END_STATUS_LABEL[EndStatus.REJECTED]}` },
  { value: `${Stage.ENDED}:${EndStatus.DECLINED}`, label: `已结束·${END_STATUS_LABEL[EndStatus.DECLINED]}` },
]

export default function RecordList() {
  const navigate = useNavigate()
  const { records, addRecord, deleteRecord } = useRecordStore()

  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [form] = Form.useForm()

  // 筛选 + 搜索 + 排序（更新时间倒序）
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // 关键字搜索
        if (search && !r.companyName.toLowerCase().includes(search.toLowerCase())) return false
        // 阶段筛选
        if (filterValue === 'all') return true
        if (filterValue.includes(':')) {
          const [stage, endStatus] = filterValue.split(':')
          return r.stage === stage && r.endStatus === endStatus
        }
        return r.stage === filterValue
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [records, search, filterValue])

  const handleAddRecord = () => {
    form.validateFields().then((values) => {
      addRecord(values.companyName.trim(), values.position.trim())
      form.resetFields()
      setAddModalOpen(false)
    })
  }

  return (
    <div className={styles.container}>
      {/* 顶部操作区 */}
      <div className={styles.toolbar}>
        <Title level={4} style={{ margin: 0 }}>面试记录</Title>
        <div className={styles.controls}>
          <Input
            placeholder="搜索公司名"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={filterValue}
            onChange={setFilterValue}
            options={FILTER_OPTIONS}
            style={{ width: 160 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
          >
            新增记录
          </Button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className={styles.list}>
        {filteredRecords.length === 0 ? (
          <Empty
            description={records.length === 0 ? '暂无记录，点击「新增记录」开始追踪求职进度' : '暂无匹配记录'}
            style={{ marginTop: 80 }}
          />
        ) : (
          filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onDelete={deleteRecord}
              onClick={(id) => navigate(`/record/${id}`)}
            />
          ))
        )}
      </div>

      {/* 新增记录弹窗 */}
      <Modal
        title="新增面试记录"
        open={addModalOpen}
        onOk={handleAddRecord}
        onCancel={() => { setAddModalOpen(false); form.resetFields() }}
        okText="确认新增"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="companyName"
            label="公司名"
            rules={[{ required: true, message: '请输入公司名' }]}
          >
            <Input placeholder="如：字节跳动" />
          </Form.Item>
          <Form.Item
            name="position"
            label="岗位名称"
            rules={[{ required: true, message: '请输入岗位名称' }]}
          >
            <Input placeholder="如：前端工程师" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
