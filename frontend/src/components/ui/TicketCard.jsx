import { Clock, User } from 'lucide-react'
import { PriorityBadge, StatusBadge } from './StatusBadge'

export default function TicketCard({ ticket, onClick }) {
  const isExtrema = ticket.priority === 'EXTREMA'

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer transition-all duration-300 relative group overflow-hidden ${
        isExtrema
          ? 'border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.08)] hover:shadow-[0_0_25px_rgba(244,63,94,0.18)]'
          : 'hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
      }`}
    >
      {/* Background Decorative Gradient Hover Effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${
        isExtrema
          ? 'from-rose-500/5 via-transparent to-transparent'
          : 'from-blue-600/5 via-transparent to-transparent'
      }`} />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <span className="text-[10px] text-slate-400 font-extrabold font-mono tracking-wider bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/40">
          #{ticket.code}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Hace {ticket.days_elapsed}d</span>
        </div>
      </div>

      <p className="text-sm font-bold text-slate-200 group-hover:text-white transition duration-200 mb-4 line-clamp-2 leading-relaxed relative z-10">
        {ticket.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-4 relative z-10">
        {ticket.ai_category && (
          <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full">
            {ticket.ai_category}
          </span>
        )}
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
      </div>

      {ticket.assigned_esp && (
        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Técnico Asignado</p>
              <p className="text-xs font-bold text-slate-300 mt-0.5">
                {ticket.assigned_esp.first_name} {ticket.assigned_esp.last_name_pat}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
