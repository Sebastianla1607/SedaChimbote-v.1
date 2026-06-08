const { getTechTickets, startRoute, arrivedAtLocation, clientAbsent, startExecution, submitTechReport } = require('../services/tech.service')

const myTickets = async (req, res) => {
  try {
    const tickets = await getTechTickets(req.user.id)
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const start = async (req, res) => {
  try {
    const ticket = await startRoute(req.user.id, parseInt(req.params.id))
    res.json({ message: 'Ruta iniciada, cliente notificado', ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const arrived = async (req, res) => {
  try {
    const result = await arrivedAtLocation(req.user.id, parseInt(req.params.id))
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const absent = async (req, res) => {
  try {
    const result = await clientAbsent(req.user.id, parseInt(req.params.id), req.body)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const execute = async (req, res) => {
  try {
    const ticket = await startExecution(req.user.id, parseInt(req.params.id))
    res.json({ message: 'Ejecución iniciada', ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const report = async (req, res) => {
  try {
    const result = await submitTechReport(req.user.id, parseInt(req.params.id), req.body)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { myTickets, start, arrived, absent, execute, report }