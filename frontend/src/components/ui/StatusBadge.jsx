export const priorityConfig = {
  BAJA: { label: 'Baja', color: 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', border: 'border-l-emerald-500' },
  MEDIA: { label: 'Media', color: 'bg-amber-950/30 text-amber-400 border-amber-500/20', dot: 'bg-amber-500', border: 'border-l-amber-500' },
  ALTA: { label: 'Alta', color: 'bg-orange-950/30 text-orange-400 border-orange-500/20', dot: 'bg-orange-500', border: 'border-l-orange-500' },
  EXTREMA: { label: 'Emergencia', color: 'bg-rose-950/40 text-rose-400 border-rose-500/30 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.15)]', dot: 'bg-rose-500', border: 'border-l-rose-500' },
}

export const statusConfig = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-slate-900/60 text-slate-400 border-slate-700/30' },
  ASIGNADO: { label: 'Asignado', color: 'bg-sky-950/30 text-sky-400 border-sky-500/20' },
  EN_CAMINO: { label: 'En camino', color: 'bg-indigo-950/30 text-indigo-400 border-indigo-500/20' },
  EJECUCION_ACTIVA: { label: 'En proceso', color: 'bg-purple-950/30 text-purple-400 border-purple-500/20' },
  PRE_CERRADO: { label: 'Pre-cerrado', color: 'bg-teal-950/30 text-teal-400 border-teal-500/20' },
  OBSERVADO: { label: 'Observado', color: 'bg-amber-950/30 text-amber-400 border-amber-500/20' },
  CERRADO: { label: 'Cerrado', color: 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' },
}

export function PriorityBadge({ priority, showDot = false }) {
  const config = priorityConfig[priority]
  if (!config) return null
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${config.color}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shadow-[0_0_6px_currentColor]`} />}
      {config.label}
    </span>
  )
}

export function StatusBadge({ status }) {
  const config = statusConfig[status]
  if (!config) return null
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border ${config.color}`}>
      {config.label}
    </span>
  )
}