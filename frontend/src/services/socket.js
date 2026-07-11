import { io } from 'socket.io-client'

let socket = null

// URL del backend (asumiendo que corre en localhost:3000 o se define en env)
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:3000'

export const initSocket = (token) => {
  if (socket) return socket
  
  socket = io(SOCKET_URL, {
    auth: { token }
  })
  
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
