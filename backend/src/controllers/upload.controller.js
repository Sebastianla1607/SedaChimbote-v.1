const path = require('path')

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' })
    }

    const folder = req.uploadFolder || 'uploads/evidencias'
    const imageUrl = `${req.protocol}://${req.get('host')}/${folder}/${req.file.filename}`

    res.json({
      message: 'Imagen subida correctamente',
      url: imageUrl,
      filename: req.file.filename
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron imágenes' })
    }

    const folder = req.uploadFolder || 'uploads/evidencias'
    const urls = req.files.map(file =>
      `${req.protocol}://${req.get('host')}/${folder}/${file.filename}`
    )

    res.json({
      message: 'Imágenes subidas correctamente',
      urls
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { uploadImage, uploadMultipleImages }