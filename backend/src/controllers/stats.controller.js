const prisma = require('../utils/prisma')

const getDashboardStats = async (req, res) => {
  try {
    // 1. Estado de los tickets
    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    // 2. Falla (categoría)
    const categoryCounts = await prisma.ticket.groupBy({
      by: ['category'],
      _count: { id: true }
    })
    
    // 3. Tickets cerrados por día (últimos 7 días)
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    const closedTickets = await prisma.ticket.findMany({
      where: {
        status: 'CERRADO',
        updatedAt: { gte: last7Days }
      },
      select: { updatedAt: true }
    })
    
    const dailyData = {}
    closedTickets.forEach(t => {
      const date = t.updatedAt.toISOString().split('T')[0]
      dailyData[date] = (dailyData[date] || 0) + 1
    })
    
    const dailyChart = Object.keys(dailyData).map(date => ({
      date,
      cerrados: dailyData[date]
    })).sort((a,b) => a.date.localeCompare(b.date))
    
    const statusChart = statusCounts.map(s => ({
      name: s.status,
      value: s._count.id
    }))
    
    const categoryChart = categoryCounts.map(c => ({
      name: c.category || 'SIN CLASIFICAR',
      value: c._count.id
    }))

    res.json({
      statusChart,
      categoryChart,
      dailyChart,
      totalTickets: statusCounts.reduce((acc, curr) => acc + curr._count.id, 0)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

module.exports = { getDashboardStats }
