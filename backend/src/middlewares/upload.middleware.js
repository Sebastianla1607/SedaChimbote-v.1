const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Crear carpetas si no existen
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'uploads/evidencias'
    createDirIfNotExists(folder)
    cb(null, folder)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    
    // Extraer datos del request
    const role = req.user?.role?.replace('_', '') || 'UNK'
    const id = req.user?.id || '0'
    const isReporte = req.uploadFolder?.includes('reportes')
    const prefix = isReporte ? 'REP' : 'EVI'
    
    // Fecha formato YYYYMMDD-HHMMSS
    const now = new Date()
    const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14)
    
    // Generar nombre ordenado: [TIPO]-[ROL][ID]-[FECHA_HORA].[EXT]
    const name = `${prefix}-${role}${id}-${dateStr}${ext}`
    
    cb(null, name)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
})

module.exports = upload