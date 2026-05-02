import { useState } from 'react'
import { Layout as AntLayout, Menu, Button, Modal, Space, message } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  UnorderedListOutlined, AppstoreOutlined, CalendarOutlined, SettingOutlined,
  ExportOutlined, ImportOutlined, PoweroffOutlined
} from '@ant-design/icons'
import { useRecordStore } from '../../store/useRecordStore'

const { Header, Content } = AntLayout

const navItems = [
  { key: '/', label: '面试组', icon: <UnorderedListOutlined /> },
  { key: '/board', label: '看板', icon: <AppstoreOutlined /> },
  { key: '/calendar', label: '日历', icon: <CalendarOutlined /> },
  { key: '/settings', label: '设置', icon: <SettingOutlined /> },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { exportData, importData } = useRecordStore()

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importContent, setImportContent] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState('')

  const handleExport = async () => {
    const payload = exportData()
    const json = JSON.stringify(payload, null, 2)
    if (window.electronAPI) {
      const ok = await window.electronAPI.exportData(json)
      if (ok) message.success('导出成功')
    } else {
      // 浏览器降级：下载文件
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `offer-track-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    }
  }

  const handleImport = async () => {
    if (window.electronAPI) {
      const content = await window.electronAPI.importData()
      if (!content) return // 用户取消
      processImportContent(content)
    } else {
      // 浏览器降级：文件选择
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => processImportContent(reader.result as string)
        reader.readAsText(file)
      }
      input.click()
    }
  }

  const processImportContent = (content: string) => {
    try {
      const payload = JSON.parse(content)
      if (!payload.version || !payload.stageTemplates || !payload.groups || !payload.records) {
        message.error('导入数据格式无效')
        return
      }
      const summary = `版本: ${payload.version} | 面试组: ${payload.groups.length} | 记录: ${payload.records.length} | 模板: ${payload.stageTemplates.length}`
      setImportSummary(summary)
      setImportContent(content)
      setImportModalOpen(true)
    } catch {
      message.error('无法解析 JSON 文件')
    }
  }

  const confirmImport = () => {
    if (!importContent) return
    try {
      const payload = JSON.parse(importContent)
      importData(payload)
      setImportModalOpen(false)
      message.success('导入成功，页面将刷新')
      setTimeout(() => window.location.reload(), 500)
    } catch {
      message.error('导入失败')
    }
  }

  const handleCloseApp = () => {
    if (window.electronAPI) {
      window.electronAPI.closeApp()
    } else {
      message.info('桌面应用模式下可用')
    }
  }

  // 当前路径匹配的导航 key（处理 /group/:id 等子路由）
  const selectedKey = navItems.find((item) => {
    if (item.key === '/') return location.pathname === '/' || location.pathname.startsWith('/group/')
    return location.pathname.startsWith(item.key)
  })?.key || '/'

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff', marginRight: 32, whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => navigate('/')}>
          OfferTrack
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, border: 'none' }}
        />
        <Space size={4}>
          <Button type="text" icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          <Button type="text" icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
          <Button type="text" icon={<PoweroffOutlined />} onClick={handleCloseApp} />
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f7fa' }}>
        <Outlet />
      </Content>

      {/* 导入确认弹窗 */}
      <Modal
        title="确认导入数据"
        open={importModalOpen}
        onOk={confirmImport}
        onCancel={() => setImportModalOpen(false)}
        okText="确认导入"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>导入将覆盖当前所有本地数据，请确认你已提前导出备份。</p>
        <p style={{ color: '#666' }}>{importSummary}</p>
      </Modal>
    </AntLayout>
  )
}
