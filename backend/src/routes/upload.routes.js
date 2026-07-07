const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload.middleware')
const { uploadImage, uploadMultipleImages } = require('../controllers/upload.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

const setFolder = (req, res, next) => {
  if (req.query.folder === 'reportes') {
    req.uploadFolder = 'uploads/reportes'
  } else {
    req.uploadFolder = 'uploads/evidencias'
  }
  next()
}

router.post('/single', verifyToken, setFolder, upload.single('image'), uploadImage)
router.post('/multiple', verifyToken, setFolder, upload.array('images', 5), uploadMultipleImages)

module.exports = router