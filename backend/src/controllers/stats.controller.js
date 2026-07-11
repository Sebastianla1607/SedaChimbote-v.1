const prisma = require('../utils/prisma')

const getDashboardStats = async (req, res) => {
  try {
    // 1. Estado de los tickets
    const statusCounts = await prisma.ticket.groupBy({ by: ['status'], _count: { id: true } })
    
    // 2. Falla (categoría)
    const categoryCounts = await prisma.ticket.groupBy({ by: ['ai_category'], _count: { id: true } })
    
    // 3. Tickets cerrados por día (últimos 7 días)
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    const closedTickets = await prisma.ticket.findMany({
      where: { status: 'CERRADO', closed_at: { gte: last7Days } },
      select: { closed_at: true }
    })
    
    const dailyData = {}
    closedTickets.forEach(t => {
      if(t.closed_at){
        const date = t.closed_at.toISOString().split('T')[0]
        dailyData[date] = (dailyData[date] || 0) + 1
      }
    })
    
    const dailyChart = Object.keys(dailyData).map(date => ({
      date, cerrados: dailyData[date]
    })).sort((a,b) => a.date.localeCompare(b.date))
    
    // ==========================================
    // ADVANCED ANALYTICS (TENDENCIAS Y SESGOS)
    // ==========================================

    // 4. MTTR (Tiempo Medio de Resolución) por Prioridad
    const ticketsForMTTR = await prisma.ticket.findMany({
      where: { status: 'CERRADO', closed_at: { not: null } },
      select: { priority: true, created_at: true, closed_at: true }
    })
    
    const mttrData = { EXTREMA: { total: 0, count: 0 }, ALTA: { total: 0, count: 0 }, MEDIA: { total: 0, count: 0 }, BAJA: { total: 0, count: 0 } }
    ticketsForMTTR.forEach(t => {
      const hours = (t.closed_at.getTime() - t.created_at.getTime()) / (1000 * 60 * 60)
      if (mttrData[t.priority]) {
        mttrData[t.priority].total += hours
        mttrData[t.priority].count += 1
      }
    })
    const mttrChart = Object.keys(mttrData).map(p => ({
      priority: p,
      hours: mttrData[p].count > 0 ? (mttrData[p].total / mttrData[p].count).toFixed(1) : 0
    }))

    // 5. Ranking de Técnicos (Velocidad vs NPS)
    const techStats = await prisma.user.findMany({
      where: { role: 'ESP_' },
      select: {
        id: true, first_name: true, last_name_pat: true,
        tickets_assigned: {
          where: { status: 'CERRADO' },
          select: { id: true, client_survey: { select: { nps_score: true } } }
        }
      }
    })
    const techRanking = techStats.map(tech => {
      const closed = tech.tickets_assigned.length
      const surveys = tech.tickets_assigned.filter(t => t.client_survey).map(t => t.client_survey.nps_score)
      const avgNps = surveys.length > 0 ? (surveys.reduce((a, b) => a + b, 0) / surveys.length).toFixed(1) : 0
      return {
        name: `${tech.first_name} ${tech.last_name_pat[0]}.`,
        closed,
        nps: parseFloat(avgNps)
      }
    }).filter(t => t.closed > 0).sort((a, b) => b.closed - a.closed) // Filtrar técnicos sin tickets cerrados

    // 6. Mapa de Calor (Geoespacial)
    // Solo traemos tickets activos o recientes para no saturar el mapa
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 30) // último mes
    const heatmapData = await prisma.ticket.findMany({
      where: { latitude: { not: null }, longitude: { not: null }, created_at: { gte: recentDate } },
      select: { latitude: true, longitude: true, priority: true, ai_category: true, status: true }
    })

    // 7. Sesgo de IA vs Tiempo Real (Dificultad)
    // Simularemos esto agrupando por categoría ya que 'ai_difficulty' no está en el prisma schema pero ai_category sí.
    const aiBiasChart = await prisma.ticket.groupBy({
      by: ['ai_category'],
      where: { status: 'CERRADO' },
      _count: { id: true }
    })

    // 8. Distribución de Demanda (Picos de Trabajo por día de semana)
    const allTickets = await prisma.ticket.findMany({ select: { created_at: true } })
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const demandData = [0,0,0,0,0,0,0]
    allTickets.forEach(t => {
      const day = t.created_at.getDay()
      demandData[day] += 1
    })
    const demandChart = daysOfWeek.map((day, index) => ({
      day,
      tickets: demandData[index]
    }))

    res.json({
      statusChart: statusCounts.map(s => ({ name: s.status, value: s._count.id })),
      categoryChart: categoryCounts.map(c => ({ name: c.ai_category || 'OTRO', value: c._count.id })),
      dailyChart,
      totalTickets: statusCounts.reduce((acc, curr) => acc + curr._count.id, 0),
      mttrChart,
      techRanking,
      heatmapData,
      demandChart
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener estadísticas avanzadas' })
  }
}

module.exports = { getDashboardStats }
