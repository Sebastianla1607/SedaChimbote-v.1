import { useNavigate, useLocation } from 'react-router-dom'
import { Home, PlusCircle, User, LayoutGrid } from 'lucide-react'

const links = {
  CLI_: [
    { path: '/dashboard', icon: Home, label: 'Inicio' },
    { path: '/client/new-ticket', icon: PlusCircle, label: 'Reportar' },
    { path: '/client/profile', icon: User, label: 'Perfil' },
  ],
  ESP_: [
    { path: '/tech/dashboard', icon: LayoutGrid, label: 'Panel' },
    { path: '/tech/profile', icon: User, label: 'Perfil' },
  ],
  ADM_: [
    { path: '/admin/dashboard', icon: LayoutGrid, label: 'Panel' },
    { path: '/admin/new-ticket', icon: PlusCircle, label: 'Nuevo' },
  ],
  JEF_: [
    { path: '/admin/dashboard', icon: LayoutGrid, label: 'Panel' },
    { path: '/admin/new-ticket', icon: PlusCircle, label: 'Nuevo' },
  ]
}

export default function BottomNav({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navLinks = links[role] || links['CLI_']

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm bg-slate-900/80 backdrop-blur-xl border border-slate-800/60 px-6 py-3.5 z-40 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around">
        {navLinks.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1.5 transition duration-300 relative py-1 px-3 rounded-xl active:scale-90"
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-slate-200'}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${isActive ? 'text-blue-400 font-extrabold' : 'text-slate-400'}`}>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_6px_#3b82f6]" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}