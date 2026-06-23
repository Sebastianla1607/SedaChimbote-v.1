import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'
import logo from '../../assets/logo_chimbote.png'

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
    <div className="bg-[#1a237e] px-4 pt-10 pb-4">
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#1a237e] font-bold text-sm">S</span>
              </div>
              <span className="text-white font-bold text-sm tracking-wide">SEDACHIMBOTE</span>
            </div>
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