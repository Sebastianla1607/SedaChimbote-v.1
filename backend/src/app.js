const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const authRoutes = require('./routes/auth.routes')
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor SEDACHIMBOTE funcionando ✅' })
})
