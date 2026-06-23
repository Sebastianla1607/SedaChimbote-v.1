import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Ticket, Map, User } from 'lucide-react'

const links = {
  CLI_: [
    { path: '/dashboard', icon: Home, label: 'Inicio' },
    { path: '/client/new-ticket', icon: Ticket, label: 'Tickets' },
    { path: '/client/map', icon: Map, label: 'Mapa' },
    { path: '/client/profile', icon: User, label: 'Perfil' },
  ],
  ESP_: [
    { path: '/tech/dashboard', icon: Home, label: 'Inicio' },
    { path: '/tech/tickets', icon: Ticket, label: 'Tickets' },
    { path: '/tech/map', icon: Map, label: 'Mapa' },
    { path: '/tech/profile', icon: User, label: 'Perfil' },
  ],
}

export default function BottomNav({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navLinks = links[role] || links['CLI_']

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-2 z-40">
      <div className="flex items-center justify-around">
        {navLinks.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 transition ${isActive ? 'text-[#1a237e]' : 'text-gray-400'}`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}