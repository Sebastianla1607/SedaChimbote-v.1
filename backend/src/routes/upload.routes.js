const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload.middleware')
const { uploadImage, uploadMultipleImages } = require('../controllers/upload.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.post('/single', verifyToken, upload.single('image'), uploadImage)
router.post('/multiple', verifyToken, upload.array('images', 5), uploadMultipleImages)

module.exports = router