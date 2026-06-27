import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/logo_chimbote.png'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { identifier, password })
      login(data.user, data.token)
      const role = data.user.role
      if (role === 'CLI_') navigate('/dashboard')
      else if (role === 'ESP_') navigate('/tech/dashboard')
      else navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-[#1a237e] px-6 pt-8 pb-6 flex flex-col items-center">
            <img src={logo} alt="SEDACHIMBOTE" className="h-20 object-contain mb-3" />
            <h1 className="text-white text-lg font-bold tracking-wide">Acceso al Sistema</h1>
            <p className="text-blue-200 text-xs mt-1">Gestión Inteligente de Incidencias</p>
          </div>

          {/* Form */}
          <div className="px-6 py-6 space-y-4">
            {error && <div className="alert-error">{error}</div>}

            <div>
              <label className="label">Usuario o Correo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ingrese su credencial"
                  className="input-base pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </button>

            <p className="text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-[#1a237e] font-semibold hover:underline">
                Regístrate como cliente
              </Link>
            </p>
          </div>

          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
            <p className="text-center text-xs text-gray-400">
              © 2024 SEDACHIMBOTE S.A. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}