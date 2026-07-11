const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

// Límite general para toda la API (Aumentado para soportar 1000 usuarios / carga intensiva)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5000, // 5000 peticiones por minuto por IP
  message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde' }
})

// Límite para login y registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 intentos
  message: { error: 'Demasiadas peticiones de autenticación, intenta de nuevo más tarde' }
})

module.exports = { generalLimiter, authLimiter, helmet }