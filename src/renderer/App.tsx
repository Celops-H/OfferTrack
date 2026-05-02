import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import GroupList from './pages/GroupList'
import RecordList from './pages/RecordList'
import Board from './pages/Board'
import Calendar from './pages/Calendar'
import RecordDetail from './pages/RecordDetail'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<GroupList />} />
        <Route path="/group/:groupId" element={<RecordList />} />
        <Route path="/board" element={<Board />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/record/:id" element={<RecordDetail />} />
    </Routes>
  )
}

export default App
