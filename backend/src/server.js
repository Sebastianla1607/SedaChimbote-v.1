const http = require('http')
const app = require('./app')
const { startCronJobs } = require('./utils/cron')
const { initSocket } = require('./socket')

const PORT = process.env.PORT || 3000

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  startCronJobs()
})