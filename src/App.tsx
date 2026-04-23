import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RecordList from './pages/RecordList'
import Board from './pages/Board'
import Calendar from './pages/Calendar'
import RecordDetail from './pages/RecordDetail'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<RecordList />} />
        <Route path="/board" element={<Board />} />
        <Route path="/calendar" element={<Calendar />} />
      </Route>
      <Route path="/record/:id" element={<RecordDetail />} />
    </Routes>
  )
}

export default App
