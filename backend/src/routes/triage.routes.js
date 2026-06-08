const express = require('express')
const router = express.Router()
const { analyzeAndCreate } = require('../controllers/triage.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')

router.post('/analyze', verifyToken, authorizeRoles('CLI_'), analyzeAndCreate)

module.exports = router