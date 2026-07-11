const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { generalLimiter, authLimiter, helmet } = require('./middlewares/security.middleware')
const errorHandler = require('./middlewares/error.middleware')
const path = require('path')
const uploadRoutes = require('./routes/upload.routes')
const compression = require('compression')
dotenv.config()

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: false,
}))
app.use(compression()) // Comprimir respuestas para internet lento
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/api', generalLimiter)

const authRoutes = require('./routes/auth.routes')
const ticketRoutes = require('./routes/ticket.routes')
const triageRoutes = require('./routes/triage.routes')
const userRoutes = require('./routes/user.routes')
const adminRoutes = require('./routes/admin.routes')
const techRoutes = require('./routes/tech.routes')
const notificationRoutes = require('./routes/notification.routes')
const specialtyRoutes = require('./routes/specialty.routes')
const statsRoutes = require('./routes/stats.routes')

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/triage', triageRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/tech', techRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/specialties', specialtyRoutes)
app.use('/api/stats', statsRoutes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/upload', uploadRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor SEDACHIMBOTE funcionando ✅' })
})

app.use(errorHandler)

module.exports = app