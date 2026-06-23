export const priorityConfig = {
  BAJA: { label: 'Baja', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', border: 'border-l-green-500' },
  MEDIA: { label: 'Media', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', border: 'border-l-yellow-500' },
  ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', border: 'border-l-orange-500' },
  EXTREMA: { label: 'Emergencia', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', border: 'border-l-red-500' },
}

export const statusConfig = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
  ASIGNADO: { label: 'Asignado', color: 'bg-blue-100 text-blue-700' },
  EN_CAMINO: { label: 'En camino', color: 'bg-indigo-100 text-indigo-700' },
  EJECUCION_ACTIVA: { label: 'En proceso', color: 'bg-purple-100 text-purple-700' },
  PRE_CERRADO: { label: 'Pre-cerrado', color: 'bg-teal-100 text-teal-700' },
  OBSERVADO: { label: 'Observado', color: 'bg-orange-100 text-orange-700' },
  CERRADO: { label: 'Cerrado', color: 'bg-green-100 text-green-700' },
}

export function PriorityBadge({ priority, showDot = false }) {
  const config = priorityConfig[priority]
  if (!config) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${config.color}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  )
}

export function StatusBadge({ status }) {
  const config = statusConfig[status]
  if (!config) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}