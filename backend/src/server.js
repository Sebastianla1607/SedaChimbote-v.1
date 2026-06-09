const app = require('./app')
const { startCronJobs } = require('./utils/cron')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  startCronJobs()
})