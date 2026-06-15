import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, User, Lock, Eye, EyeOff, LogOut, CheckCircle } from 'lucide-react'
import api from '../../services/api'

export default function TechProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.new_password !== form.confirm_password) {
      return setError('Las contraseñas no coinciden')
    }
    if (form.new_password.length < 6) {
      return setError('La contraseña debe tener mínimo 6 caracteres')
    }
    setLoading(true)
    try {
      await api.patch('/auth/change-password', {
        old_password: form.old_password,
        new_password: form.new_password
      })
      setSuccess('Contraseña actualizada correctamente')
      setForm({ old_password: '', new_password: '', confirm_password: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* Header */}
      <div className="bg-[#1a237e] px-4 pt-10 pb-8 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <button onClick={() => navigate('/tech/dashboard')} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold">Mi Perfil</h1>
          <div className="w-5" />
        </div>

        <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-white text-3xl font-bold">{user?.first_name?.[0]}</span>
        </div>
        <h2 className="text-white text-lg font-bold">{user?.first_name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-blue-800 text-blue-200 text-xs px-3 py-1 rounded-full">
            Técnico Especialista
          </span>
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-mono">
            {user?.access_code}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Datos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Información</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-[#1a237e]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="text-sm font-semibold text-gray-800">{user?.first_name}</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#1a237e]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Código de acceso</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{user?.access_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cambio de contraseña */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seguridad</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#1a237e]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800">Cambiar contraseña</p>
              <p className="text-xs text-gray-500">Cambia tu contraseña temporal por una segura</p>
            </div>
            <span className="text-gray-400 text-xs">{showForm ? '▲' : '▼'}</span>
          </button>

          {showForm && (
            <div className="px-4 pb-4 border-t border-gray-100">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs mt-3 mb-3">
                  {error}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-3 mt-3">
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={form.old_password}
                    onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                    placeholder="Contraseña actual"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={form.new_password}
                    onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                    placeholder="Nueva contraseña"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  placeholder="Confirmar nueva contraseña"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a237e] text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
                >
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={logout}
          className="w-full bg-white border border-red-200 text-red-500 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

      </div>
    </div>
  )
}