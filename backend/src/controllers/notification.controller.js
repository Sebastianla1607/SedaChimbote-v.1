const prisma = require('../utils/prisma')

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        ticket: {
          select: { code: true, status: true }
        }
      }
    })
    res.json({ notifications })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const markAsRead = async (req, res) => {
  try {
    await prisma.notification.update({
      where: {
        id: parseInt(req.params.id),
        user_id: req.user.id
      },
      data: { is_read: true }
    })
    res.json({ message: 'Notificación marcada como leída' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true }
    })
    res.json({ message: 'Todas las notificaciones marcadas como leídas' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead }