import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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

// ## Función para subir múltiples imágenes al servidor usando la instancia central de Axios
export const uploadImages = async (files, folder = 'evidencias') => {
  const formData = new FormData()
  // Aseguramos que solo se agreguen archivos válidos (File)
  files.forEach(file => {
    if (file instanceof File) {
      formData.append('images', file)
    }
  })

  const { data } = await api.post(`/upload/multiple?folder=${folder}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return data.urls
}

// ## Función para subir una imagen al servidor usando la instancia central de Axios
export const uploadSingleImage = async (file, folder = 'evidencias') => {
  const formData = new FormData()
  formData.append('image', file)

  const { data } = await api.post(`/upload/single?folder=${folder}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return data.url
}

export default api