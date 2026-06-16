const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

// Límite general para toda la API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos' }
})

// Límite estricto para login y registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Subimos de 10 a 50 para desarrollo
  message: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos' }
})

module.exports = { generalLimiter, authLimiter, helmet }