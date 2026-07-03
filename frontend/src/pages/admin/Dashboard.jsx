import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  Bell, Plus, Users, Ticket, AlertTriangle, CheckCircle,
  Clock, Eye, UserPlus, X, Loader, ChevronRight, ChevronLeft, LogOut
} from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { PriorityBadge, StatusBadge, priorityConfig } from '../../components/ui/StatusBadge'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('tickets')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('admin-sidebar-collapsed') === 'true'
  )

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('admin-sidebar-collapsed')
    } else {
      document.body.classList.remove('admin-sidebar-collapsed')
    }
    localStorage.setItem('admin-sidebar-collapsed', isCollapsed)
  }, [isCollapsed])
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
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
      {/* Decorative Orbits */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 md:hidden" />
      )}

      {/* Sidebar */}
      <div className={`bg-slate-900/60 border-r border-slate-900/60 backdrop-blur-md flex flex-col fixed h-full z-30 transition-all duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-56'}`}>
        
        {/* Toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute top-10 -right-3 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full items-center justify-center border border-slate-900 shadow-lg cursor-pointer z-50 transition hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className={`py-6 border-b border-slate-800 flex items-center justify-between transition-all duration-300 ${isCollapsed ? 'px-2 flex-col gap-2' : 'px-4'}`}>
          <div className="flex flex-col items-center">
            <Logo size="sm" collapsed={isCollapsed} />
            {!isCollapsed && (
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 animate-fade-in">Portal Administrador</p>
            )}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className={`flex-1 py-4 space-y-1.5 z-10 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setIsSidebarOpen(false) }}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-xl transition font-extrabold ${isCollapsed ? 'justify-center p-3 text-sm' : 'w-full gap-3 px-3 py-2.5 text-xs uppercase tracking-wider'} ${tab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              {item.icon}
              {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={`py-4 border-t border-slate-800/80 z-10 transition-all duration-300 ${isCollapsed ? 'px-2 flex flex-col items-center gap-4' : 'px-3'}`}>
          <div className={`flex items-center gap-2 transition-all duration-300 ${isCollapsed ? 'flex-col justify-center gap-1' : 'mb-3.5'}`}>
            <div className="w-8 h-8 bg-slate-800 border border-slate-700/50 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black uppercase">{user?.first_name?.[0]}</span>
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in overflow-hidden">
                <p className="text-white text-xs font-bold truncate">{user?.first_name}</p>
                <p className="text-blue-400 text-[10px] font-bold tracking-wider font-mono truncate">{user?.access_code}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title={isCollapsed ? 'Cerrar sesión' : undefined}
            className={`text-slate-500 hover:text-rose-455 border border-slate-800 rounded-xl hover:bg-rose-500/5 transition flex items-center justify-center ${isCollapsed ? 'p-2' : 'w-full text-[10px] font-bold uppercase tracking-wider py-1.5'}`}
          >
            {isCollapsed ? <LogOut className="w-4 h-4" /> : 'Cerrar sesión'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="md:ml-56 flex-grow flex flex-col min-h-screen w-full overflow-x-hidden z-10">

        {/* Topbar */}
        <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm md:text-lg font-black text-slate-100 uppercase tracking-wide">
                {tab === 'tickets' && 'Dashboard Operativo Central'}
                {tab === 'techs' && 'Gestión de Técnicos'}
                {tab === 'clients' && 'Clientes Registrados'}
              </h1>
              <p className="text-slate-400 text-xs font-semibold">Vista en tiempo real de operaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {tab === 'tickets' && (
              <button onClick={() => navigate('/admin/new-ticket')}
                className="btn-primary py-2 px-3 text-xs md:text-sm font-semibold flex items-center gap-1 md:gap-2">
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Nuevo Ticket</span>
              </button>
            )}
            {tab === 'techs' && (
              <button onClick={() => navigate('/admin/new-tech')}
                className="btn-primary py-2 px-3 text-xs md:text-sm font-semibold flex items-center gap-1 md:gap-2">
                <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Nuevo Técnico</span>
              </button>
            )}
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl transition">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-605 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        {showNotifications && (
          <div className="absolute top-18 right-6 w-80 bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-2xl z-50 backdrop-blur-md">
            <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">Notificaciones</span>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4 text-slate-500 hover:text-slate-300" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-6 font-semibold">Sin notificaciones</p>
              ) : notifications.map(n => (
                <div key={n.id} className={`px-4 py-3.5 border-b border-slate-800/40 ${!n.is_read ? 'bg-blue-500/5' : ''}`}>
                  <p className="text-xs text-slate-200 leading-relaxed">{n.message}</p>
                  {n.ticket && <span className="text-[10px] font-mono font-bold text-blue-400">#{n.ticket.code}</span>}
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{new Date(n.created_at).toLocaleString('es-PE')}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-800/80 text-center">
              <button onClick={async () => {
                await api.patch('/notifications/read-all')
                setUnreadCount(0)
                setNotifications(notifications.map(n => ({ ...n, is_read: true })))
              }} className="text-xs text-blue-400 font-bold hover:text-blue-300 transition">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pendientes', value: stats.active, icon: <Ticket className="w-4 h-4 text-slate-400" />, cls: 'card' },
                  { label: 'En ejecución', value: stats.executing, icon: <Loader className="w-4 h-4 text-purple-400" />, cls: 'card' },
                  { label: 'Pre-cierre', value: stats.preClosed, icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, cls: 'card border-emerald-500/20 text-emerald-400', sub: 'Requiere revisión', subCls: 'text-emerald-400' },
                  { label: 'Alertas Extremas', value: stats.extreme, icon: <AlertTriangle className="w-4 h-4 text-rose-500" />, cls: 'bg-rose-500/10 border border-rose-500/20 shadow-rose-900/10 animate-pulse', valueCls: 'text-rose-400', labelCls: 'text-rose-400', sub: 'Crítico', subCls: 'text-rose-400' },
                ].map(({ label, value, icon, cls, sub, subCls, valueCls, labelCls }) => (
                  <div key={label} className={`rounded-2xl border p-4 ${cls.includes('card') ? cls : 'rounded-2xl border p-4 ' + cls}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${labelCls || 'text-slate-500'}`}>{label}</p>
                      {icon}
                    </div>
                    <p className={`text-3xl font-black ${valueCls || 'text-white'}`}>{value}</p>
                    {sub && <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${subCls}`}>{sub}</p>}
                  </div>
                ))}
              </div>

              {/* Filtros */}
              <div className="card flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filtros:</span>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900/85 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todos los estados</option>
                  {['PENDIENTE','ASIGNADO','EN_CAMINO','EJECUCION_ACTIVA','PRE_CERRADO','OBSERVADO','CERRADO'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-slate-900/85 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todas las prioridades</option>
                  {['BAJA','MEDIA','ALTA','EXTREMA'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {(filterStatus || filterPriority) && (
                  <button onClick={() => { setFilterStatus(''); setFilterPriority('') }}
                    className="text-xs text-rose-500 font-bold hover:underline">
                    Limpiar Filtros
                  </button>
                )}
              </div>

              {/* Tabla */}
              <div className="card overflow-hidden overflow-x-auto p-0">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-slate-950/40 border-b border-slate-800/80">
                    <tr>
                      {['ID Ticket','Origen','Descripción','Prioridad','Estado','Especialista','Días','Acción'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-8"><Loader className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-slate-500 text-sm font-semibold">No se encontraron tickets registrados</td></tr>
                    ) : filteredTickets.map(ticket => (
                      <tr key={ticket.id} className={`hover:bg-slate-900/20 transition border-l-4 ${priorityConfig[ticket.priority]?.border} ${ticket.priority === 'EXTREMA' ? 'bg-rose-500/5' : ''}`}>
                        <td className="px-4 py-3"><span className="text-xs font-mono font-bold text-blue-400">#{ticket.code}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{ticket.origin === 'CIUDADANO' ? '📱 App' : '🏢 Interno'}</span></td>
                        <td className="px-4 py-3"><p className="text-sm text-slate-200 font-medium line-clamp-1 max-w-xs">{ticket.description}</p></td>
                        <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                        <td className="px-4 py-3"><span className="text-xs text-slate-300 font-bold font-mono tracking-wider">{ticket.assigned_esp?.access_code || <span className="text-slate-500 font-normal">Sin asignar</span>}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-slate-400 font-bold">{ticket.days_elapsed}d</span></td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setSelectedTicket(ticket); fetchHistory(ticket.id) }} className="text-blue-400 hover:text-blue-300 transition">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : techs.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-500 font-bold">No hay técnicos registrados</div>
              ) : techs.map(tech => (
                <div key={tech.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 border border-slate-700/50 rounded-full flex items-center justify-center">
                        <span className="text-white font-black text-sm">{tech.first_name[0]}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-sm">{tech.first_name} {tech.last_name_pat}</p>
                        <p className="text-xs text-slate-400 font-mono font-bold tracking-wide">{tech.access_code}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${tech.is_wip_locked ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      {tech.is_wip_locked ? 'En tarea' : 'Disponible'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tech.specialties?.map(s => (
                      <span key={s.specialty_id} className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {s.specialty?.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className={`text-xs font-bold ${tech.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tech.is_active ? '● Activo' : '● Inactivo'}
                    </span>
                    <p className="text-xs text-slate-500 font-bold">{new Date(tech.created_at).toLocaleDateString('es-PE')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB CLIENTES */}
          {tab === 'clients' && (
            <div className="card overflow-hidden overflow-x-auto p-0">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-950/40 border-b border-slate-800/80">
                  <tr>
                    {['Cliente','Suministro','Dirección','Tickets','Estado'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-slate-900/20 transition">
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-200">{client.first_name} {client.last_name_pat}</p>
                        <p className="text-xs text-slate-400">{client.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg tracking-wider">{client.customer?.supply_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-400 max-w-xs line-clamp-1 font-semibold">{client.customer?.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-black text-blue-400">{client.tickets_created?.length}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${client.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-md">
              <div>
                <h2 className="font-extrabold text-slate-100 text-lg">Detalle y Auditoría</h2>
                <p className="text-xs font-mono font-bold text-blue-400">#{selectedTicket.code}</p>
              </div>
              <button onClick={() => { setSelectedTicket(null); setTicketHistory(null); setShowRejectForm(false); setRejectNote('') }}>
                <X className="w-5 h-5 text-slate-500 hover:text-slate-300" />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Info básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Datos del problema</p>
                  <p className="text-sm text-slate-200 mb-3.5 leading-relaxed font-semibold">"{ticketHistory.description}"</p>
                  <div className="flex gap-2 flex-wrap">
                    <PriorityBadge priority={ticketHistory.priority} />
                    <StatusBadge status={ticketHistory.status} />
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Análisis IA</p>
                  {ticketHistory.ai_report ? (
                    <>
                      <p className="text-sm text-slate-200 mb-3.5 leading-relaxed font-semibold">{ticketHistory.ai_report}</p>
                      <div className="flex gap-2 flex-wrap">
                        {ticketHistory.ai_category && <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-bold">{ticketHistory.ai_category}</span>}
                        {ticketHistory.ai_difficulty && <span className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-bold">{ticketHistory.ai_difficulty}</span>}
                      </div>
                    </>
                  ) : <p className="text-xs text-slate-500 font-semibold italic">Ticket creado manualmente por administración</p>}
                </div>
              </div>

              {/* Reporte técnico */}
              {ticketHistory.tech_report && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-wider">Reporte del Técnico</p>
                  <p className="text-sm text-slate-200 leading-relaxed font-semibold">"{ticketHistory.tech_report.description}"</p>
                </div>
              )}

              {/* Encuesta */}
              {ticketHistory.client_survey && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-wider">Calificación del Cliente</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-xl ${star <= ticketHistory.client_survey.nps_score ? 'text-yellow-400' : 'text-slate-800'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-sm font-black text-slate-200">{ticketHistory.client_survey.nps_score}/5</span>
                  </div>
                  {ticketHistory.client_survey.comment && (
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 mt-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">COMENTARIO</p>
                      <p className="text-sm text-slate-300 italic font-semibold">"{ticketHistory.client_survey.comment}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Historial */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Historia del Ticket</p>
                <div className="space-y-3.5">
                  {ticketHistory.logs?.map(log => (
                    <div key={log.id} className="flex gap-3 items-start">
                      <div className="w-2.5 h-2.5 bg-blue-500 border border-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1 pb-3.5 border-b border-slate-800/40 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{log.action.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-500 font-bold">— {log.user?.access_code || log.user?.first_name}</span>
                        </div>
                        {log.note && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-semibold">{log.note}</p>}
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{new Date(log.created_at).toLocaleString('es-PE')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones acción */}
              <div className="flex gap-3 pt-4 border-t border-slate-800/80 flex-wrap">
                {selectedTicket.status !== 'CERRADO' && (
                  <button
                    onClick={() => { setAssigningTicketId(selectedTicket.id); setShowAssignModal(true); setTechSearch('') }}
                    className="flex-1 btn-secondary"
                  >
                    Asignar Técnico
                  </button>
                )}
                {selectedTicket.status === 'PRE_CERRADO' && !showRejectForm && (
                  <>
                    <button onClick={() => setShowRejectForm(true)}
                      className="flex-1 border border-rose-500/20 text-rose-500 font-bold py-2.5 rounded-xl text-sm hover:bg-rose-500/10 transition active:scale-[0.98]">
                      Rechazar
                    </button>
                    <button onClick={() => handleApprove(selectedTicket.id)}
                      className="flex-1 btn-primary">
                      Aprobar Cierre
                    </button>
                  </>
                )}
              </div>

              {/* Form rechazo */}
              {showRejectForm && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-bold text-rose-500 uppercase tracking-wide text-xs">Motivo del rechazo</p>
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
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-sm transition active:scale-[0.98]">
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-100">Asignar Técnico</h3>
              <button onClick={() => setShowAssignModal(false)}>
                <X className="w-5 h-5 text-slate-500 hover:text-slate-400" />
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
                  <p className="text-center text-slate-500 text-xs py-6 font-bold">No se encontraron técnicos registrados</p>
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
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-800 hover:border-blue-500 hover:bg-slate-900/30 transition text-left"
                  >
                    <div className="w-10 h-10 bg-slate-800 border border-slate-700/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-sm">{tech.first_name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-205">{tech.first_name} {tech.last_name_pat}</p>
                        <span className="text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg">{tech.access_code}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold ${tech.is_wip_locked ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {tech.is_wip_locked ? '● En tarea' : '● Disponible'}
                        </span>
                        {tech.specialties?.map(s => (
                          <span key={s.specialty_id} className="text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            {s.specialty?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
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