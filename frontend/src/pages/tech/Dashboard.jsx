import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Clock, AlertTriangle, CheckCircle, ChevronRight, Loader, User } from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'
import MobileHeader from '../../components/layout/MobileHeader'
import NotificationPanel from '../../components/ui/NotificationPanel'
import EmptyState from '../../components/ui/EmptyState'
import { PriorityBadge, StatusBadge, priorityConfig } from '../../components/ui/StatusBadge'

export default function TechDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('pendientes')
  const [tickets, setTickets] = useState({ active: [], waiting_close: [] })
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
    fetchNotifications()
  }, [])

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/tech/tickets')
      setTickets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnreadCount(data.notifications.filter(n => !n.is_read).length)
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const displayed = tab === 'pendientes' ? tickets.active : tickets.waiting_close

  return (
    <div className="mobile-container relative">

      {/* Header */}
      <div className="bg-[#1a237e] px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{user?.first_name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <p className="text-blue-300 text-xs">Activo · {user?.access_code}</p>
              </div>
            </div>
          </div>
          <MobileHeader
            showBell
            unreadCount={unreadCount}
            onBellClick={() => {
              setShowNotifications(!showNotifications)
              if (!showNotifications) markAllRead()
            }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-2xl font-bold">{tickets.active.length}</p>
            <p className="text-blue-300 text-xs">Pendientes</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-2xl font-bold">{tickets.waiting_close.length}</p>
            <p className="text-blue-300 text-xs">Pre-Cerrados</p>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAllRead={markAllRead}
        />
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex">
          <button
            onClick={() => setTab('pendientes')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === 'pendientes' ? 'border-[#1a237e] text-[#1a237e]' : 'border-transparent text-gray-400'}`}
          >
            Pendientes
            {tickets.active.length > 0 && (
              <span className="ml-1 bg-[#1a237e] text-white text-xs px-1.5 py-0.5 rounded-full">{tickets.active.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('pre-cerrados')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === 'pre-cerrados' ? 'border-[#1a237e] text-[#1a237e]' : 'border-transparent text-gray-400'}`}
          >
            Pre-Cerrados
            {tickets.waiting_close.length > 0 && (
              <span className="ml-1 bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full">{tickets.waiting_close.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Lista tickets */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-nav space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-[#1a237e] animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="w-8 h-8 text-gray-300" />}
            title={tab === 'pendientes' ? 'No tienes tickets pendientes' : 'Sin tickets pre-cerrados'}
            subtitle="¡Buen trabajo! 🎉"
          />
        ) : (
          displayed.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/tech/ticket/${ticket.id}`)}
              className="card cursor-pointer active:scale-95 transition"
            >
              {ticket.priority === 'EXTREMA' && (
                <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-red-600">ATENCIÓN URGENTE REQUERIDA</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityConfig[ticket.priority]?.dot}`}></span>
                  <span className="text-xs text-gray-400 font-mono">#{ticket.code}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(ticket.created_at).toLocaleDateString('es-PE')}
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{ticket.description}</p>

              {ticket.address && (
                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {ticket.address}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav role="ESP_" />
    </div>
  )
}