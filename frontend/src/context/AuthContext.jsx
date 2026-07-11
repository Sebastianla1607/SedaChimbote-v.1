import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Aplicar tema al HTML
  useEffect(() => {
    if (user?.theme === 'light') {
      document.documentElement.classList.add('light-theme')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.remove('light-theme')
      document.documentElement.classList.add('dark')
    }
  }, [user?.theme])

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.documentElement.classList.remove('light-theme')
  }

  const toggleTheme = async () => {
    if (!user) return
    const newTheme = user.theme === 'light' ? 'dark' : 'light'
    
    // Actualizar local optimista
    const updatedUser = { ...user, theme: newTheme }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))

    // Sincronizar con backend
    try {
      await api.patch('/users/theme', { theme: newTheme })
    } catch (error) {
      console.error('Error al actualizar tema', error)
      // Revertir si falla
      const revertedUser = { ...user, theme: user.theme }
      setUser(revertedUser)
      localStorage.setItem('user', JSON.stringify(revertedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, toggleTheme, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)