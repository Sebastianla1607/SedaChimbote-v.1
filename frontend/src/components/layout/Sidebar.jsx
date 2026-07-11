import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Home, Ticket, User, LogOut, Plus, UserPlus, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import Logo from '../ui/Logo'

const menuItems = {
  CLI_: [
    { path: '/dashboard', label: 'Inicio', icon: Home },
    { path: '/client/new-ticket', label: 'Nuevo Reclamo', icon: Plus },
    { path: '/client/profile', label: 'Mi Perfil', icon: User },
  ],
  ESP_: [
    { path: '/tech/dashboard', label: 'Inicio', icon: Home },
    { path: '/tech/profile', label: 'Mi Perfil', icon: User },
  ],
  ADM_: [
    { path: '/admin/dashboard', label: 'Inicio', icon: Home },
    { path: '/admin/new-ticket', label: 'Nuevo Ticket', icon: Plus },
    { path: '/admin/new-tech', label: 'Nuevo Técnico', icon: UserPlus },
  ],
  JEF_: [
    { path: '/admin/dashboard', label: 'Inicio', icon: Home },
    { path: '/admin/new-ticket', label: 'Nuevo Ticket', icon: Plus },
    { path: '/admin/new-tech', label: 'Nuevo Técnico', icon: UserPlus },
  ]
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('sidebar-collapsed') === 'true'
  )

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed')
    } else {
      document.body.classList.remove('sidebar-collapsed')
    }
    localStorage.setItem('sidebar-collapsed', isCollapsed)
  }, [isCollapsed])

  if (!user) return null

  const role = user.role
  const items = menuItems[role] || []

  return (
    <div className={`hidden md:flex flex-col bg-slate-950 text-white fixed h-full z-30 shadow-2xl border-r border-slate-900 transition-all duration-300 sidebar-container ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-10 -right-3 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center border border-slate-900 shadow-lg cursor-pointer z-50 transition hover:scale-110 active:scale-95"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header */}
      <div className={`py-8 border-b border-slate-900 flex flex-col items-center relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
        <Logo collapsed={isCollapsed} size={isCollapsed ? 'sm' : 'md'} className="z-10" />
        {!isCollapsed && (
          <p className="text-slate-400 text-[10px] mt-2.5 font-bold uppercase tracking-widest z-10 animate-fade-in">
            {role === 'CLI_' && 'Portal Ciudadano'}
            {role === 'ESP_' && 'Portal Técnico'}
            {(role === 'ADM_' || role === 'JEF_') && 'Portal Admin'}
          </p>
        )}
      </div>

      {/* Nav Menu */}
      <nav className={`flex-1 py-6 space-y-2 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {items.map(item => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition duration-200 ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/5'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-semibold truncate animate-fade-in">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Profile & Logout Footer */}
      <div className={`p-4 border-t border-slate-900 bg-slate-900/40 transition-all duration-300 ${isCollapsed ? 'p-2 flex flex-col items-center gap-4' : ''}`}>
        
        {/* Profile Card */}
        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'flex-col justify-center gap-1.5' : 'mb-4'}`}>
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
            {user.first_name?.[0]}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-fade-in">
              <p className="text-slate-100 text-sm font-semibold truncate">{user.first_name} {user.last_name_pat}</p>
              <p className="text-slate-400 text-xs truncate">
                {role === 'CLI_' ? `Suministro: ${user.id}` : user.access_code}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
          className={`flex items-center justify-center bg-rose-600/10 hover:bg-rose-600 text-rose-300 hover:text-white transition duration-200 ${
            isCollapsed 
              ? 'p-2.5 rounded-xl' 
              : 'w-full gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl'
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="animate-fade-in">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  )
}
