const express = require('express')
const router = express.Router()
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.get('/', verifyToken, getMyNotifications)
router.patch('/:id/read', verifyToken, markAsRead)
router.patch('/read-all', verifyToken, markAllAsRead)

module.exports = router