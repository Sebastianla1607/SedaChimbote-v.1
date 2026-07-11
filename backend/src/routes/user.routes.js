const express = require('express')
const router = express.Router()
const { create, list, deactivate, updateTheme } = require('../controllers/user.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')
const { createEmployeeValidator } = require('../middlewares/validators')
const validate = require('../middlewares/validate.middleware')

router.post('/', verifyToken, authorizeRoles('ADM_', 'JEF_'), createEmployeeValidator, validate, create)
router.get('/', verifyToken, authorizeRoles('ADM_', 'JEF_'), list)
router.patch('/theme', verifyToken, updateTheme)
router.patch('/:id/deactivate', verifyToken, authorizeRoles('ADM_', 'JEF_'), deactivate)

module.exports = router