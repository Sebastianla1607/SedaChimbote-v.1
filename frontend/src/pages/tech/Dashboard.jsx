import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Bell, Home, Ticket, Map, User, Clock, AlertTriangle, CheckCircle, ChevronRight, XCircle, Loader } from 'lucide-react'

const priorityConfig = {
  BAJA: { label: 'Prioridad Baja', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  MEDIA: { label: 'Prioridad Media', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  ALTA: { label: 'Prioridad Alta', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  EXTREMA: { label: 'Prioridad Extrema', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
}

const statusConfig = {
  ASIGNADO: { label: 'Pendiente', color: 'bg-blue-100 text-blue-700' },
  EN_CAMINO: { label: 'En camino', color: 'bg-indigo-100 text-indigo-700' },
  EJECUCION_ACTIVA: { label: 'En ejecución', color: 'bg-purple-100 text-purple-700' },
  OBSERVADO: { label: 'Observado', color: 'bg-orange-100 text-orange-700' },
  PRE_CERRADO: { label: 'Pre-cerrado', color: 'bg-teal-100 text-teal-700' },
}

export default function TechDashboard() {
  const { user, logout } = useAuth()
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
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">

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
          <button
            onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead() }}
            className="relative text-white"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
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
        <div className="absolute top-32 right-4 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">Notificaciones</span>
            <button onClick={() => setShowNotifications(false)}>
              <XCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Sin notificaciones</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('es-PE')}</p>
                </div>
              ))
            )}
          </div>
        </div>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-[#1a237e] animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              {tab === 'pendientes' ? 'No tienes tickets pendientes' : 'Sin tickets pre-cerrados'}
            </p>
            <p className="text-gray-400 text-sm mt-1">¡Buen trabajo! 🎉</p>
          </div>
        ) : (
          displayed.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/tech/ticket/${ticket.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-pointer active:scale-95 transition"
            >
              {/* Prioridad extrema warning */}
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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[ticket.priority]?.color}`}>
                    {priorityConfig[ticket.priority]?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[ticket.status]?.color}`}>
                    {statusConfig[ticket.status]?.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-[#1a237e]">
            <Home className="w-5 h-5" />
            <span className="text-xs font-semibold">Inicio</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Ticket className="w-5 h-5" />
            <span className="text-xs">Tickets</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Map className="w-5 h-5" />
            <span className="text-xs">Mapa</span>
          </button>
          <button
  onClick={() => navigate('/tech/profile')}
  className="flex flex-col items-center gap-1 text-gray-400"
>
  <User className="w-5 h-5" />
  <span className="text-xs">Perfil</span>
</button>
        </div>
      </div>

    </div>
  )
}