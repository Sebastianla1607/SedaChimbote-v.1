const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/auth.controller')
const { registerValidator, loginValidator } = require('../middlewares/validators')
const validate = require('../middlewares/validate.middleware')
const { register, login, changePassword } = require('../controllers/auth.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.post('/register', registerValidator, validate, register)
router.post('/login', loginValidator, validate, login)
router.patch('/change-password', verifyToken, changePassword)
ñl
module.exports = router