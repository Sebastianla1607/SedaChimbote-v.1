const express = require('express')
const router = express.Router()
const { listTickets, createInternal, assign, approve, reject, getHistory, getClients } = require('../controllers/admin.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')

router.get('/tickets', verifyToken, authorizeRoles('ADM_', 'JEF_'), listTickets)
router.post('/tickets', verifyToken, authorizeRoles('ADM_', 'JEF_'), createInternal)
router.patch('/tickets/:id/assign', verifyToken, authorizeRoles('ADM_', 'JEF_'), assign)
router.patch('/tickets/:id/approve', verifyToken, authorizeRoles('ADM_', 'JEF_'), approve)
router.patch('/tickets/:id/reject', verifyToken, authorizeRoles('ADM_', 'JEF_'), reject)
router.get('/tickets/:id/history', verifyToken, authorizeRoles('ADM_', 'JEF_'), getHistory)
router.get('/clients', verifyToken, authorizeRoles('ADM_', 'JEF_'), getClients)

module.exports = router