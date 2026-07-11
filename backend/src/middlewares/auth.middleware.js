const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Usuario inactivo o eliminado' })
    }
    
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' })
    }
    next()
  }
}

module.exports = { verifyToken, authorizeRoles }