const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message)

  // Error de Prisma — registro duplicado
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Ya existe un registro con esos datos' })
  }

  // Error de Prisma — registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' })
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado, inicia sesión de nuevo' })
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }

  // Error genérico
  const status = err.status || 500
  const message = err.message || 'Error interno del servidor'
  res.status(status).json({ error: message })
}

module.exports = errorHandler