import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Clock, AlertTriangle, CheckCircle, ChevronRight, Loader, User, MapPin, Bell } from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'
import MobileHeader from '../../components/layout/MobileHeader'
import Sidebar from '../../components/layout/Sidebar'
import NotificationPanel from '../../components/ui/NotificationPanel'
import EmptyState from '../../components/ui/EmptyState'
import { TechCounters } from '../../components/ui/TechPerformance'
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
  const [performanceData, setPerformanceData] = useState(null)

  useEffect(() => {
    fetchTickets()
    fetchNotifications()
    fetchPerformance()
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

  const fetchPerformance = async () => {
    try {
      const { data } = await api.get('/tech/performance')
      setPerformanceData(data)
    } catch (err) {
      console.error(err)
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
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Decorative Orbits */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col mobile-container relative z-10">

        {/* Header */}
        <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-6 md:px-8 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 border border-slate-700/50 rounded-full flex items-center justify-center shadow-inner">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-extrabold text-sm">{user?.first_name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <p className="text-slate-400 text-xs font-semibold">Técnico · {user?.access_code}</p>
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
            <button onClick={() => {
              setShowNotifications(!showNotifications)
              if (!showNotifications) markAllRead()
            }} className="hidden md:flex relative text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl transition">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto mt-4">
            {[
              { label: 'Pendientes', value: tickets.active.length },
              { label: 'Pre-Cerrados', value: tickets.waiting_close.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center shadow-lg w-full">
                <p className="text-white text-2xl font-black">{value}</p>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          
          {/* Mini contadores de rendimiento */}
          <TechCounters performanceData={performanceData} />
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
        <div className="bg-slate-950 border-b border-slate-900 px-4 md:px-8">
          <div className="flex max-w-md mx-auto">
            <button
              onClick={() => setTab('pendientes')}
              className={`flex-1 py-4 text-center text-xs uppercase tracking-wider font-extrabold border-b-2 transition ${
                tab === 'pendientes'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Pendientes
              {tickets.active.length > 0 && (
                <span className="ml-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">{tickets.active.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('pre-cerrados')}
              className={`flex-1 py-4 text-center text-xs uppercase tracking-wider font-extrabold border-b-2 transition ${
                tab === 'pre-cerrados'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Pre-Cerrados
              {tickets.waiting_close.length > 0 && (
                <span className="ml-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">{tickets.waiting_close.length}</span>
              )}
            </button>
          </div>
        </div>
        
        {/* Lista tickets */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-nav flex flex-col gap-3 max-w-3xl mx-auto w-full md:px-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="col-span-full py-12">
              <EmptyState
                title={tab === 'pendientes' ? 'No tienes tickets pendientes' : 'Sin tickets pre-cerrados'}
                description="¡Buen trabajo! 🎉"
              />
            </div>
          ) : (
            displayed.map(ticket => {
              const isExtrema = ticket.priority === 'EXTREMA'
              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tech/ticket/${ticket.id}`)}
                  className={`bg-slate-900/30 border border-slate-800/50 rounded-lg p-3.5 cursor-pointer transition-colors duration-200 flex flex-col gap-2 ${
                    isExtrema
                      ? 'border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5'
                      : 'hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {isExtrema && (
                    <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md px-2 py-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">ATENCIÓN URGENTE</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-300 font-medium bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                        #{ticket.code}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {new Date(ticket.created_at).toLocaleDateString('es-PE')}
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-1.5 items-center">
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{ticket.address || 'Sin dirección'}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <BottomNav role="ESP_" />
      </div>
    </div>
  )
}