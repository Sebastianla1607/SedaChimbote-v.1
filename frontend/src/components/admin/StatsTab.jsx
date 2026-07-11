import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts'
import { AlertCircle, Clock, Map, TrendingUp, Users, Loader, Target, PieChart as PieChartIcon, CheckCircle } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const COLORS = {
  PENDIENTE: '#64748b', ASIGNADO: '#3b82f6', EN_CAMINO: '#eab308', 
  EJECUCION_ACTIVA: '#f59e0b', PRE_CERRADO: '#10b981', OBSERVADO: '#f43f5e', 
  CERRADO: '#059669', OTRO: '#94a3b8'
}
const PRIORITY_COLORS = { EXTREMA: '#ef4444', ALTA: '#f97316', MEDIA: '#eab308', BAJA: '#3b82f6' }

export default function StatsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/stats/dashboard')
        setData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="flex justify-center p-12"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (!data) return <div className="p-12 text-center text-slate-500">Error al cargar estadísticas</div>

  return (
    <div className="space-y-6">
      
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Histórico</p>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-white">{data.totalTickets}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cerrados (7d)</p>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-white">
            {data.dailyChart.reduce((acc, curr) => acc + curr.cerrados, 0)}
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">MTTR (Promedio)</p>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-white">
            {data.mttrChart.length > 0 ? (data.mttrChart.reduce((a,b)=>a+parseFloat(b.hours),0)/data.mttrChart.length).toFixed(1) : 0} <span className="text-sm font-semibold text-slate-500">hrs</span>
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">NPS Promedio</p>
            <Target className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-black text-white">
            {data.techRanking.length > 0 ? (data.techRanking.reduce((a,b)=>a+parseFloat(b.nps),0)/data.techRanking.length).toFixed(1) : 0} <span className="text-sm font-semibold text-slate-500">/ 5</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. MTTR por Prioridad */}
        <div className="card">
          <h3 className="text-sm font-extrabold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" /> Tiempos de Resolución (MTTR)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mttrChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="priority" stroke="#64748b" fontSize={10} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={val => `${val}h`} />
                <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {data.mttrChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-4 font-semibold text-center">Horas promedio desde reporte hasta cierre por nivel de urgencia.</p>
        </div>

        {/* 2. Tendencia de Cierres (7 días) */}
        <div className="card">
          <h3 className="text-sm font-extrabold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Tendencia de Resolución (7d)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyChart}>
                <defs>
                  <linearGradient id="colorCerrados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis stroke="#64748b" fontSize={10} />
                <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                <Area type="monotone" dataKey="cerrados" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCerrados)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Ranking de Técnicos (Velocidad vs Calidad) */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-extrabold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Rendimiento de Técnicos (Tickets Cerrados vs Satisfacción)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                  <th className="pb-3 pr-4">Técnico</th>
                  <th className="pb-3 px-4">Tickets Cerrados</th>
                  <th className="pb-3 px-4">NPS (Satisfacción)</th>
                  <th className="pb-3 pl-4">Evaluación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.techRanking.slice(0, 10).map((tech, i) => (
                  <tr key={i} className="hover:bg-slate-900/30 transition">
                    <td className="py-3 pr-4 font-bold text-white">{tech.name}</td>
                    <td className="py-3 px-4 text-blue-400 font-black">{tech.closed}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-yellow-400">{tech.nps}</span>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(tech.nps / 5) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pl-4">
                      {tech.nps >= 4.5 ? <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Sobresaliente</span> :
                       tech.nps >= 3.5 ? <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full uppercase">Bueno</span> :
                       <span className="text-[10px] font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full uppercase">Requiere Mejora</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Distribución de Demanda */}
        <div className="card">
          <h3 className="text-sm font-extrabold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" /> Picos de Demanda (Días)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.demandChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                <Bar dataKey="tickets" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Incidencias por Estado */}
        <div className="card">
          <h3 className="text-sm font-extrabold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-cyan-500" /> Estado del Inventario
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusChart} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {data.statusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.OTRO} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {data.statusChart.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[s.name] || COLORS.OTRO}}></span>
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* 6. Mapa de Calor Geoespacial */}
        <div className="card lg:col-span-2 relative overflow-hidden h-[500px] p-0 border border-slate-800 rounded-2xl ring-1 ring-white/5 shadow-2xl">
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-widest flex items-center gap-2 mb-2">
              <Map className="w-4 h-4 text-rose-500" /> Mapa de Incidencias
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Zonas Críticas (Últimos 30 días)</p>
          </div>
          
          <MapContainer center={[-9.0745, -78.5936]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {data.heatmapData.map((marker, i) => (
              <CircleMarker
                key={i}
                center={[marker.latitude, marker.longitude]}
                radius={marker.priority === 'EXTREMA' ? 12 : marker.priority === 'ALTA' ? 8 : 5}
                pathOptions={{
                  color: PRIORITY_COLORS[marker.priority] || '#3b82f6',
                  fillColor: PRIORITY_COLORS[marker.priority] || '#3b82f6',
                  fillOpacity: 0.6,
                  weight: 1
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-slate-900 text-slate-200 p-1">
                    <p className="font-bold text-xs">{marker.ai_category || 'Ticket'}</p>
                    <p className="text-[10px] uppercase font-bold mt-1" style={{color: PRIORITY_COLORS[marker.priority]}}>{marker.priority}</p>
                    <p className="text-[10px] mt-1">{marker.status}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

      </div>
    </div>
  )
}
