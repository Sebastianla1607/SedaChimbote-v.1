import { Clock, User } from 'lucide-react'
import { PriorityBadge, StatusBadge } from './StatusBadge'

export default function TicketCard({ ticket, onClick }) {
  const isExtrema = ticket.priority === 'EXTREMA'

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/30 border border-slate-800/50 rounded-lg p-3.5 cursor-pointer transition-colors duration-200 flex flex-col gap-2 ${
        isExtrema
          ? 'border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5'
          : 'hover:border-slate-700 hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-300 font-medium bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
            #{ticket.code}
          </span>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
          <Clock className="w-3 h-3 text-slate-600" />
          <span>Hace {ticket.days_elapsed}d</span>
        </div>
      </div>

      <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
        {ticket.description}
      </p>

      <div className="flex items-center justify-between mt-1">
        <div className="flex gap-1.5 items-center">
          <PriorityBadge priority={ticket.priority} />
          {ticket.ai_category && (
            <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-800/40 rounded-full border border-slate-700/50">
              {ticket.ai_category}
            </span>
          )}
        </div>
        
        {ticket.assigned_esp && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] text-slate-400 font-medium">
              {ticket.assigned_esp.first_name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
