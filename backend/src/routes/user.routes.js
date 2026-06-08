const express = require('express')
const router = express.Router()
const { create, list, deactivate } = require('../controllers/user.controller')
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware')

router.post('/', verifyToken, authorizeRoles('ADM_', 'JEF_'), create)
router.get('/', verifyToken, authorizeRoles('ADM_', 'JEF_'), list)
router.patch('/:id/deactivate', verifyToken, authorizeRoles('ADM_', 'JEF_'), deactivate)

module.exports = router