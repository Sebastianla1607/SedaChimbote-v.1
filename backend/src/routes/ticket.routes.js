const express = require('express')
const router = express.Router()
const { create, getMyTickets, getDetail, submitSurvey } = require('../controllers/ticket.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')

router.post('/', verifyToken, authorizeRoles('CLI_'), create)
router.get('/my-tickets', verifyToken, authorizeRoles('CLI_'), getMyTickets)
router.get('/:id', verifyToken, getDetail)
router.post('/:id/survey', verifyToken, authorizeRoles('CLI_'), submitSurvey)

module.exports = router