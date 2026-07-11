const express = require('express')
const router = express.Router()
const { getDashboardStats } = require('../controllers/stats.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')

// Solo JEF_ y ADM_ pueden ver estadísticas (en tu doc el Jefe es el principal)
router.get('/dashboard', verifyToken, authorizeRoles('JEF_', 'ADM_'), getDashboardStats)

module.exports = router
