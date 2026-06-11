const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/auth.controller')
const { registerValidator, loginValidator } = require('../middlewares/validators')
const validate = require('../middlewares/validate.middleware')

router.post('/register', registerValidator, validate, register)
router.post('/login', loginValidator, validate, login)

module.exports = router