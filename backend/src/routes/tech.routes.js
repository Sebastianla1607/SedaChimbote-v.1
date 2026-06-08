const express = require('express')
const router = express.Router()
const { myTickets, start, arrived, absent, execute, report } = require('../controllers/tech.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')

router.get('/tickets', verifyToken, authorizeRoles('ESP_'), myTickets)
router.patch('/tickets/:id/start', verifyToken, authorizeRoles('ESP_'), start)
router.patch('/tickets/:id/arrived', verifyToken, authorizeRoles('ESP_'), arrived)
router.patch('/tickets/:id/absent', verifyToken, authorizeRoles('ESP_'), absent)
router.patch('/tickets/:id/execute', verifyToken, authorizeRoles('ESP_'), execute)
router.post('/tickets/:id/report', verifyToken, authorizeRoles('ESP_'), report)

module.exports = router