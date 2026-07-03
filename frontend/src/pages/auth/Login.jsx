import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Logo from '../../components/ui/Logo'
import { Eye, EyeOff, Lock, User } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Orbes brillantes decorativos */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-sm z-10 animate-fade-in-up">
        {/* Contenedor con borde degradado de 1px brillante */}
        <div className="p-[1px] rounded-[2rem] bg-gradient-to-br from-indigo-500 via-blue-500/20 to-cyan-500 shadow-2xl">
          <div className="bg-slate-900/90 rounded-[1.95rem] overflow-hidden border border-slate-800/80 backdrop-blur-md">

            {/* Cabecera */}
            <div className="bg-slate-950/40 border-b border-slate-800/60 px-6 pt-10 pb-8 flex flex-col items-center relative">
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              <Logo size="lg" className="mb-4 z-10" />
              <h1 className="text-white text-xl font-black uppercase tracking-wide z-10">Acceso al Sistema</h1>
              <p className="text-slate-400 text-xs mt-1 z-10 font-bold uppercase tracking-wider">Gestión de Incidencias</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="px-6 py-8 space-y-5">
              {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl px-4 py-3.5 text-xs font-semibold">{error}</div>}

              <div>
                <label className="label">Usuario o Correo</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="     Código o correo"
                    className="input-base pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="     ••••••••"
                    className="input-base pl-12 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2"
              >
                {loading ? 'Ingresando...' : 'Ingresar al Portal'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2 font-bold uppercase tracking-wider">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-extrabold hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </form>

            {/* Footer */}
            <div className="bg-slate-950/40 border-t border-slate-800/80 px-6 py-4">
              <p className="text-center text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                © 2026 SEDACHIMBOTE S.A.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}