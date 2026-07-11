import { useState, useEffect } from 'react'
import api from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { Loader, Activity, Users, TicketCheck, TrendingUp } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stats/dashboard')
        setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  const cerradosHoy = stats?.dailyChart?.[stats?.dailyChart?.length - 1]?.cerrados || 0

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tickets Totales', value: stats?.totalTickets || 0, icon: <Activity className="w-4 h-4 text-blue-400" /> },
          { label: 'Cerrados Hoy', value: cerradosHoy, icon: <TicketCheck className="w-4 h-4 text-emerald-400" /> },
          { label: 'Satisfacción', value: '4.8/5', icon: <Users className="w-4 h-4 text-amber-400" /> },
          { label: 'Crecimiento', value: '+12%', icon: <TrendingUp className="w-4 h-4 text-indigo-400" /> },
        ].map((kpi, i) => (
          <div key={i} className="card p-4 flex flex-col items-start gap-2 hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between w-full">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{kpi.label}</p>
              <div className="w-6 h-6 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
                {kpi.icon}
              </div>
            </div>
            <p className="text-2xl font-black text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets por Estado */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Estado de Tickets</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {stats?.statusChart?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }} itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidencias por Categoría */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Tipos de Falla (IA)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.categoryChart} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} width={100} />
                <Tooltip cursor={{ fill: '#0f172a' }} contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {stats?.categoryChart?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia de Cierre */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Resolución de Tickets (Últimos 7 días)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.dailyChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }} labelStyle={{ color: '#94a3b8', marginBottom: '4px' }} />
                <Line type="monotone" dataKey="cerrados" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#059669' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
