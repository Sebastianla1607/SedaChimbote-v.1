import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ClientDashboard from './pages/client/Dashboard'
import NewTicket from './pages/client/NewTicket'
import TechDashboard from './pages/tech/Dashboard'
import TicketDetail from './pages/tech/TicketDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AdminNewTicket from './pages/admin/NewTicket'
import NewTech from './pages/admin/NewTech'
import TicketInProgress from './pages/client/TicketInProgress'
import Profile from './pages/client/Profile'
import TechProfile from './pages/tech/Profile'




const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />
  return children
}

const HomeRedirect = () => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (user.role === 'CLI_') return <Navigate to="/dashboard" />
  if (user.role === 'ESP_') return <Navigate to="/tech/dashboard" />
  if (user.role === 'ADM_') return <Navigate to="/admin/dashboard" />
  if (user.role === 'JEF_') return <Navigate to="/admin/dashboard" />
  return <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/dashboard" element={<PrivateRoute roles={['CLI_']}><ClientDashboard /></PrivateRoute>} />
      <Route path="/client/new-ticket" element={<PrivateRoute roles={['CLI_']}><NewTicket /></PrivateRoute>} />
      <Route path="/tech/dashboard" element={<PrivateRoute roles={['ESP_']}><TechDashboard /></PrivateRoute>} />
      <Route path="*" element={<HomeRedirect />} />
      <Route path="/tech/ticket/:id" element={<PrivateRoute roles={['ESP_']}><TicketDetail /></PrivateRoute>} />
      <Route path="/admin/dashboard" element={<PrivateRoute roles={['ADM_', 'JEF_']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/new-ticket" element={<PrivateRoute roles={['ADM_', 'JEF_']}><AdminNewTicket /></PrivateRoute>} />
      <Route path="/admin/new-tech" element={<PrivateRoute roles={['ADM_', 'JEF_']}><NewTech /></PrivateRoute>} />
      <Route path="/client/ticket/:id" element={<PrivateRoute roles={['CLI_']}><TicketInProgress /></PrivateRoute>} />
      <Route path="/client/profile" element={<PrivateRoute roles={['CLI_']}><Profile /></PrivateRoute>} />
      <Route path="/tech/profile" element={<PrivateRoute roles={['ESP_']}><TechProfile /></PrivateRoute>} />
    </Routes>
  )
}

export default App