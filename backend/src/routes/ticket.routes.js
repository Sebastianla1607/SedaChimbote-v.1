const express = require('express')
const router = express.Router()
const { create, getMyTickets, getDetail, submitSurvey, respondPresence, submitConformity } = require('../controllers/ticket.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')
const { createTicketValidator, surveyValidator } = require('../middlewares/validators')
const validate = require('../middlewares/validate.middleware')

router.post('/', verifyToken, authorizeRoles('CLI_'), createTicketValidator, validate, create)
router.get('/my-tickets', verifyToken, authorizeRoles('CLI_'), getMyTickets)
router.get('/:id', verifyToken, getDetail)
router.post('/:id/survey', verifyToken, authorizeRoles('CLI_'), surveyValidator, validate, submitSurvey)
router.post('/:id/presence', verifyToken, authorizeRoles('CLI_'), respondPresence)
router.post('/:id/conformity', verifyToken, authorizeRoles('CLI_'), submitConformity)

module.exports = router