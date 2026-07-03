import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'
import Logo from '../ui/Logo'

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  showLogo = false,
  showBell = false,
  unreadCount = 0,
  onBellClick,
  onBackClick,
  canGoBack = true,
}) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (!canGoBack) return
    if (onBackClick) onBackClick()
    else navigate(-1)
  }

  return (
    <div className="md:hidden bg-slate-950/40 backdrop-blur-md border-b border-slate-900 px-4 pt-10 pb-4 sticky top-0 z-40">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className={`text-white ${!canGoBack ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {showLogo && (
            <Logo size="sm" />
          )}
          {!showLogo && title && (
            <div>
              <h1 className="text-white font-bold">{title}</h1>
              {subtitle && <p className="text-blue-300 text-xs">{subtitle}</p>}
            </div>
          )}
        </div>

        {showBell && (
          <button onClick={onBellClick} className="relative text-white">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}