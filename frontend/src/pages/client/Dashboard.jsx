import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Plus, Clock, Ticket, User, XCircle, Loader, Bell } from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'
import MobileHeader from '../../components/layout/MobileHeader'
import Sidebar from '../../components/layout/Sidebar'
import NotificationPanel from '../../components/ui/NotificationPanel'
import EmptyState from '../../components/ui/EmptyState'
import { PriorityBadge, StatusBadge } from '../../components/ui/StatusBadge'
import { generateTicketPDF } from '../../services/pdfGenerator'
import { Download } from 'lucide-react'
import TicketCard from '../../components/ui/TicketCard'

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('activos')
  const [tickets, setTickets] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    fetchTickets()
    fetchNotifications()
  }, [])

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/tickets/my-tickets')
      setTickets(data.tickets)
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

  const activeTickets = tickets.filter(t => t.status !== 'CERRADO')
  const historyTickets = tickets.filter(t => t.status === 'CERRADO')
  const displayed = tab === 'activos' ? activeTickets : historyTickets

  return (
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Decorative Orbits */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col mobile-container relative z-10">

        {/* Header */}
        <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-6 md:px-8 md:py-8">
          <MobileHeader
            showLogo
            showBell
            unreadCount={unreadCount}
            onBellClick={() => {
              setShowNotifications(!showNotifications)
              if (!showNotifications) markAllRead()
            }}
          />

          <div className="hidden md:flex items-center justify-between mb-4">
            <h2 className="text-white text-2xl font-extrabold mt-2">Hola, {user?.first_name} 👋</h2>
            <button onClick={() => {
              setShowNotifications(!showNotifications)
              if (!showNotifications) markAllRead()
            }} className="relative text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl transition">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          
          <h2 className="md:hidden text-white text-2xl font-extrabold mt-2">Hola, {user?.first_name} 👋</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="bg-blue-600/15 text-blue-300 border border-blue-500/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Suministro: N° {user?.id}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 md:max-w-xl">
            {[
              { label: 'Activos', value: activeTickets.length },
              { label: 'Cerrados', value: historyTickets.length },
              { label: 'Avisos', value: unreadCount },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-center shadow-lg">
                <p className="text-white text-xl font-black">{value}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
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
        <div className="bg-slate-950 border-b border-slate-900 px-4 md:px-8">
          <div className="flex max-w-md mx-auto">
            <button
              onClick={() => setTab('activos')}
              className={`flex-1 py-4 text-center text-xs uppercase tracking-wider font-extrabold border-b-2 transition ${
                tab === 'activos'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Activos {activeTickets.length > 0 && (
                <span className="ml-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">{activeTickets.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('historial')}
              className={`flex-1 py-4 text-center text-xs uppercase tracking-wider font-extrabold border-b-2 transition ${
                tab === 'historial'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Historial
            </button>
          </div>
        </div>

        {/* Lista tickets */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 md:pb-24 flex flex-col gap-3 max-w-3xl mx-auto w-full md:px-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="col-span-full py-12">
              <EmptyState
                title={tab === 'activos' ? 'No tienes reclamos activos' : 'No hay reclamos en el historial'}
                description={tab === 'activos' ? 'Si tienes algún inconveniente con el servicio, repórtalo aquí.' : ''}
              />
            </div>
          ) : (
            displayed.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => {
                  if (['EN_CAMINO', 'EJECUCION_ACTIVA', 'PRE_CERRADO', 'CERRADO'].includes(ticket.status)) {
                    navigate(`/client/ticket/${ticket.id}`)
                  } else if (ticket.status === 'ASIGNADO' && ticket.tech_accepted) {
                    navigate(`/client/ticket/${ticket.id}`)
                  } else {
                    setSelectedTicket(ticket)
                  }
                }}
              />
            ))
          )}
        </div>



        {/* Modal detalle ticket */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center md:p-4">
            <div className="absolute inset-0" onClick={() => setSelectedTicket(null)} />
            <div className="bg-slate-900 border-t md:border border-slate-800 rounded-t-[2rem] md:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 z-10 shadow-2xl relative">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-slate-100 text-lg">Detalle del Reclamo</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => generateTicketPDF(selectedTicket)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-md shadow-blue-600/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-200 transition">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold font-mono bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg text-slate-300">#{selectedTicket.code}</span>
                  <StatusBadge status={selectedTicket.status} />
                  <PriorityBadge priority={selectedTicket.priority} />
                </div>

                <p className="text-sm text-slate-300 bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl">{selectedTicket.description}</p>

                {selectedTicket.reference_point && (
                  <div className="card">
                    <p className="label mb-1">Punto de referencia</p>
                    <p className="text-sm text-slate-200 font-semibold">{selectedTicket.reference_point}</p>
                  </div>
                )}

                {selectedTicket.ai_category && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <p className="label text-blue-400 mb-1">Categorización por IA</p>
                    <p className="text-sm text-slate-200">Categoría: <span className="font-bold text-blue-400">{selectedTicket.ai_category}</span></p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="card">
                    <p className="label mb-1">Creado</p>
                    <p className="text-sm text-slate-200 font-semibold">{new Date(selectedTicket.created_at).toLocaleDateString('es-PE')}</p>
                  </div>
                  <div className="card">
                    <p className="label mb-1">Vence</p>
                    <p className="text-sm text-slate-200 font-semibold">{new Date(selectedTicket.due_date).toLocaleDateString('es-PE')}</p>
                  </div>
                </div>

                {selectedTicket.evidences && selectedTicket.evidences.filter(ev => ev.type === 'REPORTE_INICIAL').length > 0 && (
                  <div className="card border border-slate-800/60 shadow-xl bg-slate-900/50">
                    <p className="label mb-2">Evidencias Fotográficas (Cliente)</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                      {selectedTicket.evidences.filter(ev => ev.type === 'REPORTE_INICIAL').map((ev, i) => (
                        <div key={i} className="relative flex-shrink-0 w-24 h-24 snap-start">
                          <img src={ev.image_url} alt="Evidencia" className="w-full h-full object-cover rounded-xl border border-slate-700/80" />
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                            Cliente
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.assigned_esp?.access_code && (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Técnico Asignado</p>
                      <p className="text-white font-extrabold text-sm mt-0.5">{selectedTicket.assigned_esp.access_code}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <BottomNav role="CLI_" />
      </div>
    </div>
  )
}