import React, { useState, useMemo } from 'react'

export function TechCounters({ performanceData }) {
  if (!performanceData) return null

  const { daily, monthly, total } = performanceData

  const renderMini = (label, closed, target, color) => {
    const isMet = target ? closed >= target : false
    let colorClass = color === 'blue' ? 'text-blue-400' : color === 'purple' ? 'text-purple-400' : 'text-amber-400'
    if (isMet) colorClass = 'text-emerald-400'
    
    return (
      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-md px-2 py-1 shadow-sm relative overflow-hidden">
        {isMet && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />}
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest z-10">{label}</span>
        <span className={`text-[11px] font-black z-10 ${colorClass}`}>
          {target ? `${closed}/${target}` : closed}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
      {renderMini('Hoy:', daily.closed, daily.target, 'blue')}
      {renderMini('Mes:', monthly.closed, monthly.target, 'purple')}
      {renderMini('Total:', total, null, 'amber')}
    </div>
  )
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function PerformanceCalendar({ calendar = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null)

  const { year, month, daysInMonth, startDow, calendarMap, today } = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() // 0-indexed
    const dim = new Date(y, m + 1, 0).getDate()
    // Day of week for the 1st, adjusted to Monday=0
    const rawDow = new Date(y, m, 1).getDay()
    const dow = rawDow === 0 ? 6 : rawDow - 1

    // Build lookup from calendar array
    const map = {}
    calendar.forEach(entry => {
      const d = new Date(entry.date)
      const key = d.getDate()
      map[key] = entry
    })

    const todayStr = now.getDate()

    return { year: y, month: m, daysInMonth: dim, startDow: dow, calendarMap: map, today: todayStr }
  }, [calendar])

  const cells = useMemo(() => {
    const arr = []
    // Empty offset cells
    for (let i = 0; i < startDow; i++) {
      arr.push({ empty: true, key: `e-${i}` })
    }
    const now = new Date()
    for (let d = 1; d <= daysInMonth; d++) {
      const entry = calendarMap[d]
      const isFuture = new Date(year, month, d) > now
      const isToday = d === today
      arr.push({
        day: d,
        key: d,
        count: entry?.count ?? 0,
        metQuota: entry?.met_quota ?? false,
        isFuture,
        isToday,
      })
    }
    return arr
  }, [daysInMonth, startDow, calendarMap, today, year, month])

  if (!calendar || calendar.length === 0) return null

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-lg w-full">
      {/* Month header */}
      <h3 className="text-center text-sm font-extrabold text-white uppercase tracking-wider mb-4">
        {MONTHS_ES[month]} {year}
      </h3>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((lbl, i) => (
          <div key={i} className="text-center text-[10px] text-slate-500 font-bold uppercase">
            {lbl}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(cell => {
          if (cell.empty) {
            return <div key={cell.key} />
          }

          let bg = 'border border-slate-700/60 bg-transparent'
          let textColor = 'text-slate-500'

          if (!cell.isFuture && cell.metQuota) {
            bg = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            textColor = 'text-white'
          } else if (!cell.isFuture && cell.count > 0) {
            bg = 'bg-slate-600'
            textColor = 'text-slate-200'
          }

          const todayRing = cell.isToday ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-950' : ''

          return (
            <div
              key={cell.key}
              className="relative flex items-center justify-center"
              onMouseEnter={() => setHoveredDay(cell.day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200 cursor-default ${bg} ${textColor} ${todayRing}`}>
                {cell.day}
              </div>

              {/* Tooltip */}
              {hoveredDay === cell.day && !cell.isFuture && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-[10px] text-slate-200 font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-20 pointer-events-none">
                  {cell.count} ticket{cell.count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
        {[
          { color: 'bg-emerald-500', label: 'Meta' },
          { color: 'bg-slate-600', label: 'Trabajó' },
          { color: 'border border-slate-700 bg-transparent', label: 'Sin act.' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-[10px] text-slate-400 font-bold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
