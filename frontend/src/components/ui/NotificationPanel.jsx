import { X } from 'lucide-react'
import api from '../../services/api'

export default function NotificationPanel({ notifications, onClose, onMarkAllRead }) {
  return (
    <div className="absolute top-24 right-4 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-sm">Notificaciones</span>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">Sin notificaciones</p>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}
            >
              <p className="text-sm text-gray-700">{n.message}</p>
              {n.ticket?.code && (
                <span className="text-xs font-mono text-[#1a237e]">#{n.ticket.code}</span>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleDateString('es-PE')}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100">
        <button
          onClick={onMarkAllRead}
          className="text-xs text-[#1a237e] font-semibold hover:underline"
        >
          Marcar todas como leídas
        </button>
      </div>
    </div>
  )
}