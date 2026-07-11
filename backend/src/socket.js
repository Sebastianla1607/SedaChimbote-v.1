const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

let io
const userSockets = new Map() // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
  })

  // Middleware de autenticación para sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Authentication error: Token missing'))
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = decoded
      next()
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user.id
    userSockets.set(userId, socket.id)
    
    // Unir al socket a una sala basada en su rol (ej: 'ADM_', 'JEF_')
    socket.join(socket.user.role)

    socket.on('disconnect', () => {
      if (userSockets.get(userId) === socket.id) {
        userSockets.delete(userId)
      }
    })
  })
}

const getIo = () => {
  if (!io) throw new Error('Socket.io no inicializado')
  return io
}

const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId)
  if (socketId && io) {
    io.to(socketId).emit(event, data)
  }
}

const emitToRole = (role, event, data) => {
  if (io) {
    io.to(role).emit(event, data)
  }
}

module.exports = { initSocket, getIo, emitToUser, emitToRole }
