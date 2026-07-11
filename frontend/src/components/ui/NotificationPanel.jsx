import { X, Bell, Check } from 'lucide-react'

export default function NotificationPanel({ notifications, onClose, onMarkAllRead }) {
  return (
    <div className="absolute top-24 md:top-20 right-2 sm:right-4 md:right-8 w-[calc(100vw-1rem)] sm:w-80 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.6)] border border-slate-800/80 z-[9999] overflow-hidden animate-fade-in-up">
      <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <span className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">Notificaciones</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <Bell className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-center text-slate-500 text-xs font-semibold uppercase tracking-wider">Sin notificaciones</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`px-4 py-3.5 hover:bg-slate-800/20 transition ${!n.is_read ? 'bg-blue-600/5' : ''}`}
            >
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{n.message}</p>
              <div className="flex items-center justify-between mt-2">
                {n.ticket?.code && (
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    #{n.ticket.code}
                  </span>
                )}
                <p className="text-[10px] text-slate-500 font-medium">
                  {new Date(n.created_at).toLocaleDateString('es-PE')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/40 text-center">
        <button
          onClick={onMarkAllRead}
          className="text-[10px] text-blue-400 font-bold uppercase tracking-wider hover:text-blue-300 transition flex items-center justify-center gap-1.5 w-full py-1 hover:bg-blue-500/5 rounded-lg"
        >
          <Check className="w-3.5 h-3.5" />
          Marcar todas como leídas
        </button>
      </div>
    </div>
  )
}