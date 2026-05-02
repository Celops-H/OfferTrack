import { Layout as AntLayout, Menu } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { UnorderedListOutlined, AppstoreOutlined, CalendarOutlined, SettingOutlined } from '@ant-design/icons'

const { Header, Content } = AntLayout

const navItems = [
  { key: '/', label: '记录列表', icon: <UnorderedListOutlined /> },
  { key: '/board', label: '看板', icon: <AppstoreOutlined /> },
  { key: '/calendar', label: '日历', icon: <CalendarOutlined /> },
  { key: '/settings', label: '设置', icon: <SettingOutlined /> },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff', marginRight: 48, whiteSpace: 'nowrap' }}>
          OfferTrack
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, border: 'none' }}
        />
      </Header>
      <Content style={{ padding: '24px', background: '#f5f7fa' }}>
        <Outlet />
      </Content>
    </AntLayout>
  )
}
