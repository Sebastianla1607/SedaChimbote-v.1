import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  Bell, Plus, Users, Ticket, AlertTriangle, CheckCircle,
  Clock, Eye, UserPlus, X, Loader, ChevronRight
} from 'lucide-react'
import logo from '../../assets/logo_chimbote.png'
import { PriorityBadge, StatusBadge, priorityConfig } from '../../components/ui/StatusBadge'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [techs, setTechs] = useState([])
  const [clients, setClients] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketHistory, setTicketHistory] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [techSearch, setTechSearch] = useState('')
  const [assigningTicketId, setAssigningTicketId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [ticketsRes, techsRes, clientsRes, notifsRes] = await Promise.all([
        api.get('/admin/tickets'),
        api.get('/users?role=ESP_'),
        api.get('/admin/clients'),
        api.get('/notifications')
      ])
      setTickets(ticketsRes.data.tickets)
      setTechs(techsRes.data.users)
      setClients(clientsRes.data.clients)
      setNotifications(notifsRes.data.notifications)
      setUnreadCount(notifsRes.data.notifications.filter(n => !n.is_read).length)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async (ticketId) => {
    try {
      const { data } = await api.get(`/admin/tickets/${ticketId}/history`)
      setTicketHistory(data.ticket)
    } catch (err) { console.error(err) }
  }

  const handleApprove = async (ticketId) => {
    try {
      await api.patch(`/admin/tickets/${ticketId}/approve`, {})
      await fetchAll()
      setSelectedTicket(null)
      setTicketHistory(null)
    } catch (err) { alert(err.response?.data?.error || 'Error al aprobar') }
  }

  const handleReject = async (ticketId) => {
    if (!rejectNote.trim()) return alert('El motivo es obligatorio')
    try {
      await api.patch(`/admin/tickets/${ticketId}/reject`, { note: rejectNote })
      await fetchAll()
      setSelectedTicket(null)
      setTicketHistory(null)
      setRejectNote('')
      setShowRejectForm(false)
    } catch (err) { alert(err.response?.data?.error || 'Error al rechazar') }
  }

  const filteredTickets = tickets.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const stats = {
    active: tickets.filter(t => t.status !== 'CERRADO').length,
    executing: tickets.filter(t => t.status === 'EJECUCION_ACTIVA').length,
    preClosed: tickets.filter(t => t.status === 'PRE_CERRADO').length,
    extreme: tickets.filter(t => t.priority === 'EXTREMA' && t.status !== 'CERRADO').length,
  }

  const navItems = [
    { id: 'tickets', label: 'Tickets', icon: <Ticket className="w-4 h-4" /> },
    { id: 'techs', label: 'Técnicos', icon: <Users className="w-4 h-4" /> },
    { id: 'clients', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
  ]

  const filteredTechs = techs.filter(t =>
    t.is_active && (
      techSearch === '' ||
      t.access_code?.toLowerCase().includes(techSearch.toLowerCase()) ||
      t.first_name?.toLowerCase().includes(techSearch.toLowerCase()) ||
      t.last_name_pat?.toLowerCase().includes(techSearch.toLowerCase())
    )
  )

  return (
    <div className="min-h-screen bg-gray-50 flex relative">

      {/* Sidebar */}
      <div className="w-56 bg-[#1a237e] flex flex-col fixed h-full z-20">
        <div className="px-4 py-6 border-b border-blue-800">
          <img src={logo} alt="SEDACHIMBOTE" className="h-12 object-contain mb-2" />
          <p className="text-blue-300 text-xs">Smart Water Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${tab === item.id ? 'bg-white text-[#1a237e]' : 'text-blue-300 hover:bg-blue-800'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.first_name?.[0]}</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{user?.first_name}</p>
              <p className="text-blue-400 text-xs">{user?.access_code}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-blue-400 hover:text-white text-xs py-1 transition">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="ml-56 flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {tab === 'tickets' && 'Dashboard Operativo Central'}
              {tab === 'techs' && 'Gestión de Técnicos'}
              {tab === 'clients' && 'Clientes Registrados'}
            </h1>
            <p className="text-gray-500 text-sm">Vista en tiempo real de operaciones</p>
          </div>
          <div className="flex items-center gap-3">
            {tab === 'tickets' && (
              <button onClick={() => navigate('/admin/new-ticket')}
                className="bg-[#1a237e] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nuevo Ticket
              </button>
            )}
            {tab === 'techs' && (
              <button onClick={() => navigate('/admin/new-tech')}
                className="bg-[#1a237e] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Nuevo Técnico
              </button>
            )}
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        {showNotifications && (
          <div className="absolute top-16 right-6 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800 text-sm">Notificaciones</span>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Sin notificaciones</p>
              ) : notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                  <p className="text-sm text-gray-700">{n.message}</p>
                  {n.ticket && <span className="text-xs font-mono text-[#1a237e]">#{n.ticket.code}</span>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('es-PE')}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-100">
              <button onClick={async () => {
                await api.patch('/notifications/read-all')
                setUnreadCount(0)
                setNotifications(notifications.map(n => ({ ...n, is_read: true })))
              }} className="text-xs text-[#1a237e] font-semibold hover:underline">
                Marcar todas como leídas
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 p-6">

          {/* TAB TICKETS */}
          {tab === 'tickets' && (
            <div className="space-y-6">

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Pendientes', value: stats.active, icon: <Ticket className="w-4 h-4 text-gray-400" />, cls: 'bg-white' },
                  { label: 'En ejecución', value: stats.executing, icon: <Loader className="w-4 h-4 text-purple-400" />, cls: 'bg-white' },
                  { label: 'Pre-cierre', value: stats.preClosed, icon: <CheckCircle className="w-4 h-4 text-teal-400" />, cls: 'bg-white', sub: 'Requiere revisión', subCls: 'text-teal-600' },
                  { label: 'Alertas Extremas', value: stats.extreme, icon: <AlertTriangle className="w-4 h-4 text-red-500" />, cls: 'bg-red-50 border-red-200', valueCls: 'text-red-600', labelCls: 'text-red-500', sub: 'Crítico', subCls: 'text-red-500' },
                ].map(({ label, value, icon, cls, sub, subCls, valueCls, labelCls }) => (
                  <div key={label} className={`rounded-xl border border-gray-200 p-4 ${cls}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-xs font-semibold uppercase ${labelCls || 'text-gray-500'}`}>{label}</p>
                      {icon}
                    </div>
                    <p className={`text-3xl font-bold ${valueCls || 'text-gray-800'}`}>{value}</p>
                    {sub && <p className={`text-xs mt-1 font-semibold ${subCls}`}>{sub}</p>}
                  </div>
                ))}
              </div>

              {/* Filtros */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Filtros:</span>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]">
                  <option value="">Todos los estados</option>
                  {['PENDIENTE','ASIGNADO','EN_CAMINO','EJECUCION_ACTIVA','PRE_CERRADO','OBSERVADO','CERRADO'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]">
                  <option value="">Todas las prioridades</option>
                  {['BAJA','MEDIA','ALTA','EXTREMA'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {(filterStatus || filterPriority) && (
                  <button onClick={() => { setFilterStatus(''); setFilterPriority('') }}
                    className="text-xs text-red-500 hover:underline">
                    Limpiar
                  </button>
                )}
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['ID Ticket','Origen','Descripción','Prioridad','Estado','Especialista','Días','Acción'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-8"><Loader className="w-6 h-6 animate-spin mx-auto text-[#1a237e]" /></td></tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No hay tickets</td></tr>
                    ) : filteredTickets.map(ticket => (
                      <tr key={ticket.id} className={`hover:bg-gray-50 transition border-l-4 ${priorityConfig[ticket.priority]?.border} ${ticket.priority === 'EXTREMA' ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3"><span className="text-xs font-mono font-bold text-[#1a237e]">#{ticket.code}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-gray-500">{ticket.origin === 'CIUDADANO' ? '📱 App' : '🏢 Interno'}</span></td>
                        <td className="px-4 py-3"><p className="text-sm text-gray-700 line-clamp-1 max-w-xs">{ticket.description}</p></td>
                        <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                        <td className="px-4 py-3"><span className="text-xs text-gray-600 font-medium">{ticket.assigned_esp?.access_code || <span className="text-gray-400">Sin asignar</span>}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-gray-500">{ticket.days_elapsed}d</span></td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setSelectedTicket(ticket); fetchHistory(ticket.id) }} className="text-[#1a237e] hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB TÉCNICOS */}
          {tab === 'techs' && (
            <div className="grid grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-3 flex justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-[#1a237e]" />
                </div>
              ) : techs.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-gray-400">No hay técnicos registrados</div>
              ) : techs.map(tech => (
                <div key={tech.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1a237e] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{tech.first_name[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{tech.first_name} {tech.last_name_pat}</p>
                        <p className="text-xs text-gray-500 font-mono">{tech.access_code}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tech.is_wip_locked ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {tech.is_wip_locked ? 'En tarea' : 'Disponible'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tech.specialties?.map(s => (
                      <span key={s.specialty_id} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {s.specialty?.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className={`text-xs ${tech.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      {tech.is_active ? '● Activo' : '● Inactivo'}
                    </span>
                    <p className="text-xs text-gray-400">{new Date(tech.created_at).toLocaleDateString('es-PE')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB CLIENTES */}
          {tab === 'clients' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Cliente','Suministro','Dirección','Tickets','Estado'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">{client.first_name} {client.last_name_pat}</p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{client.customer?.supply_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 max-w-xs line-clamp-1">{client.customer?.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-[#1a237e]">{client.tickets_created?.length}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${client.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {client.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle ticket */}
      {selectedTicket && ticketHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800">Detalle y Auditoría</h2>
                <p className="text-xs font-mono text-[#1a237e]">#{selectedTicket.code}</p>
              </div>
              <button onClick={() => { setSelectedTicket(null); setTicketHistory(null); setShowRejectForm(false); setRejectNote('') }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Datos del problema</p>
                  <p className="text-sm text-gray-700 mb-2">{ticketHistory.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <PriorityBadge priority={ticketHistory.priority} />
                    <StatusBadge status={ticketHistory.status} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Análisis IA</p>
                  {ticketHistory.ai_report ? (
                    <>
                      <p className="text-sm text-gray-700 mb-2">{ticketHistory.ai_report}</p>
                      <div className="flex gap-2 flex-wrap">
                        {ticketHistory.ai_category && <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{ticketHistory.ai_category}</span>}
                        {ticketHistory.ai_difficulty && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{ticketHistory.ai_difficulty}</span>}
                      </div>
                    </>
                  ) : <p className="text-xs text-gray-400">Ticket creado manualmente</p>}
                </div>
              </div>

              {/* Reporte técnico */}
              {ticketHistory.tech_report && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-2 uppercase">Reporte del Técnico</p>
                  <p className="text-sm text-gray-700">{ticketHistory.tech_report.description}</p>
                </div>
              )}

              {/* Encuesta */}
              {ticketHistory.client_survey && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-700 mb-2 uppercase">Calificación del Cliente</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-xl ${star <= ticketHistory.client_survey.nps_score ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{ticketHistory.client_survey.nps_score}/5</span>
                  </div>
                  {ticketHistory.client_survey.comment && (
                    <div className="bg-white rounded-lg p-3 mt-2">
                      <p className="text-xs text-gray-500 font-semibold mb-1">COMENTARIO</p>
                      <p className="text-sm text-gray-700 italic">"{ticketHistory.client_survey.comment}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Historial */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Historia del Ticket</p>
                <div className="space-y-2">
                  {ticketHistory.logs?.map(log => (
                    <div key={log.id} className="flex gap-3 items-start">
                      <div className="w-2 h-2 bg-[#1a237e] rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">{log.action}</span>
                          <span className="text-xs text-gray-400">— {log.user?.access_code || log.user?.first_name}</span>
                        </div>
                        {log.note && <p className="text-xs text-gray-500">{log.note}</p>}
                        <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('es-PE')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones acción */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 flex-wrap">
                {selectedTicket.status !== 'CERRADO' && (
                  <button
                    onClick={() => { setAssigningTicketId(selectedTicket.id); setShowAssignModal(true); setTechSearch('') }}
                    className="flex-1 border border-[#1a237e] text-[#1a237e] font-semibold py-2.5 rounded-xl text-sm"
                  >
                    Asignar Técnico
                  </button>
                )}
                {selectedTicket.status === 'PRE_CERRADO' && !showRejectForm && (
                  <>
                    <button onClick={() => setShowRejectForm(true)}
                      className="flex-1 border border-red-400 text-red-500 font-semibold py-2.5 rounded-xl text-sm">
                      Rechazar
                    </button>
                    <button onClick={() => handleApprove(selectedTicket.id)}
                      className="flex-1 bg-[#1a237e] text-white font-semibold py-2.5 rounded-xl text-sm">
                      Aprobar Cierre
                    </button>
                  </>
                )}
              </div>

              {/* Form rechazo */}
              {showRejectForm && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-700">Motivo del rechazo</p>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Describe el motivo del rechazo..."
                    rows={3}
                    className="input-base resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowRejectForm(false); setRejectNote('') }}
                      className="flex-1 btn-secondary text-sm py-2">
                      Cancelar
                    </button>
                    <button onClick={() => handleReject(selectedTicket.id)}
                      className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-xl text-sm">
                      Confirmar Rechazo
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Modal asignar técnico */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Asignar Técnico</h3>
              <button onClick={() => setShowAssignModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4">
              <input
                type="text"
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="input-base mb-4"
                autoFocus
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredTechs.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">No se encontraron técnicos</p>
                ) : filteredTechs.map(tech => (
                  <button
                    key={tech.id}
                    onClick={async () => {
                      try {
                        await api.patch(`/admin/tickets/${assigningTicketId}/assign`, { esp_id: tech.id })
                        await fetchAll()
                        fetchHistory(assigningTicketId)
                        setShowAssignModal(false)
                        setTechSearch('')
                      } catch (err) {
                        alert(err.response?.data?.error || 'Error al asignar')
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#1a237e] hover:bg-blue-50 transition text-left"
                  >
                    <div className="w-10 h-10 bg-[#1a237e] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{tech.first_name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{tech.first_name} {tech.last_name_pat}</p>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{tech.access_code}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold ${tech.is_wip_locked ? 'text-orange-500' : 'text-green-600'}`}>
                          {tech.is_wip_locked ? '● En tarea' : '● Disponible'}
                        </span>
                        {tech.specialties?.map(s => (
                          <span key={s.specialty_id} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                            {s.specialty?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}