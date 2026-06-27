import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Agregar token automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
// ## Función para subir imágenes al servidor
export const uploadImages = async (files) => {
  const formData = new FormData()
  files.forEach(file => formData.append('images', file))

  const token = localStorage.getItem('token')
  const response = await fetch('http://localhost:3000/api/upload/multiple', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data.urls
}

export const uploadSingleImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)

  const token = localStorage.getItem('token')
  const response = await fetch('http://localhost:3000/api/upload/single', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data.url
}

export default api