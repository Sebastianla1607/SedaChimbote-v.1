import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Plus, Clock, Ticket, User, XCircle, Loader } from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'
import MobileHeader from '../../components/layout/MobileHeader'
import NotificationPanel from '../../components/ui/NotificationPanel'
import EmptyState from '../../components/ui/EmptyState'
import { PriorityBadge, StatusBadge } from '../../components/ui/StatusBadge'
import { generateTicketPDF } from '../../services/pdfGenerator'
import { Download } from 'lucide-react'

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
    <div className="mobile-container relative">

      {/* Header */}
      <div className="bg-[#1a237e] px-4 pt-10 pb-6">
        <MobileHeader
          showLogo
          showBell
          unreadCount={unreadCount}
          onBellClick={() => {
            setShowNotifications(!showNotifications)
            if (!showNotifications) markAllRead()
          }}
        />

        <h2 className="text-white text-xl font-bold mt-2">Hola, {user?.first_name} 👋</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-blue-800 text-blue-200 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Suministro: N° {user?.id}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">{activeTickets.length}</p>
            <p className="text-blue-300 text-xs">Activos</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">{historyTickets.length}</p>
            <p className="text-blue-300 text-xs">Cerrados</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">{unreadCount}</p>
            <p className="text-blue-300 text-xs">Avisos</p>
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
            onClick={() => setTab('activos')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === 'activos' ? 'border-[#1a237e] text-[#1a237e]' : 'border-transparent text-gray-400'}`}
          >
            Activos {activeTickets.length > 0 && (
              <span className="ml-1 bg-[#1a237e] text-white text-xs px-1.5 py-0.5 rounded-full">{activeTickets.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === 'historial' ? 'border-[#1a237e] text-[#1a237e]' : 'border-transparent text-gray-400'}`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Lista tickets */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-[#1a237e] animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={<Ticket className="w-8 h-8 text-gray-300" />}
            title={tab === 'activos' ? 'No tienes reclamos activos' : 'Sin historial de reclamos'}
            subtitle={tab === 'activos' ? 'Presiona el botón para reportar uno' : 'Aquí aparecerán tus reclamos cerrados'}
          />
        ) : (
          displayed.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => {
                if (['EN_CAMINO', 'EJECUCION_ACTIVA', 'PRE_CERRADO', 'CERRADO'].includes(ticket.status)) {
                  navigate(`/client/ticket/${ticket.id}`)
                } else if (ticket.status === 'ASIGNADO' && ticket.tech_accepted) {
                  navigate(`/client/ticket/${ticket.id}`)
                } else {
                  setSelectedTicket(ticket)
                }
              }}
              className="card cursor-pointer active:scale-95 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-400 font-mono">#{ticket.code}</span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Hace {ticket.days_elapsed}d
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2">{ticket.description}</p>

              <div className="flex items-center gap-2 flex-wrap">
                {ticket.ai_category && (
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {ticket.ai_category}
                  </span>
                )}
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>

              {ticket.assigned_esp?.access_code && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#1a237e] rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">
                    Técnico: <span className="font-semibold text-gray-700">{ticket.assigned_esp.access_code}</span>
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Botón flotante */}
      {tab === 'activos' && (
        <button
          onClick={() => { if (activeTickets.length === 0) navigate('/client/new-ticket') }}
          disabled={activeTickets.length > 0}
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 font-semibold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition text-white ${activeTickets.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a237e] hover:bg-[#283593]'}`}
        >
          <Plus className="w-5 h-5" />
          {activeTickets.length > 0 ? 'Ya tienes un reclamo activo' : 'Reportar Nuevo Reclamo'}
        </button>
      )}

      {/* Modal detalle ticket - MODIFICADO CON BOTÓN PDF */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Detalle del Reclamo</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateTicketPDF(selectedTicket)}
                  className="flex items-center gap-1 bg-[#1a237e] text-white text-xs px-3 py-1.5 rounded-lg"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
                <button onClick={() => setSelectedTicket(null)}>
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">#{selectedTicket.code}</span>
                <StatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
              </div>

              <p className="text-sm text-gray-700">{selectedTicket.description}</p>

              {selectedTicket.reference_point && (
                <div className="card">
                  <p className="label mb-1">Punto de referencia</p>
                  <p className="text-sm text-gray-700">{selectedTicket.reference_point}</p>
                </div>
              )}

              {selectedTicket.ai_category && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="label text-blue-600 mb-1">Análisis de IA</p>
                  <p className="text-sm text-gray-700">Categoría: <span className="font-semibold">{selectedTicket.ai_category}</span></p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="card">
                  <p className="label mb-1">Creado</p>
                  <p className="text-sm text-gray-700">{new Date(selectedTicket.created_at).toLocaleDateString('es-PE')}</p>
                </div>
                <div className="card">
                  <p className="label mb-1">Vence</p>
                  <p className="text-sm text-gray-700">{new Date(selectedTicket.due_date).toLocaleDateString('es-PE')}</p>
                </div>
              </div>

              {selectedTicket.assigned_esp?.access_code && (
                <div className="bg-[#1a237e] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-[#1a237e]" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 font-semibold">TÉCNICO ASIGNADO</p>
                    <p className="text-white font-bold text-sm">{selectedTicket.assigned_esp.access_code}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav role="CLI_" />
    </div>
  )
}