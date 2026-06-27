import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Eye, EyeOff, LogOut, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import MobileHeader from '../../components/layout/MobileHeader'
import BottomNav from '../../components/layout/BottomNav'

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
    if (form.new_password !== form.confirm_password) return setError('Las contraseñas no coinciden')
    if (form.new_password.length < 6) return setError('Mínimo 6 caracteres')
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
    <div className="mobile-container">
      <div className="bg-[#1a237e] px-4 pt-10 pb-8 flex flex-col items-center">
        <div className="w-full mb-4">
          <MobileHeader showBack title="Mi Perfil" onBackClick={() => navigate('/tech/dashboard')} />
        </div>
        <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-white text-3xl font-bold">{user?.first_name?.[0]}</span>
        </div>
        <h2 className="text-white text-lg font-bold">{user?.first_name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-blue-800 text-blue-200 text-xs px-3 py-1 rounded-full">Técnico Especialista</span>
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-mono">{user?.access_code}</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4 pb-nav">

        {success && (
          <div className="alert-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />{success}
          </div>
        )}

        {/* Datos */}
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="label">Información</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-[#1a237e] font-bold text-sm">{user?.first_name?.[0]}</span>
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
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="label">Seguridad</p>
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
              {error && <div className="alert-error mt-3 mb-3">{error}</div>}
              <form onSubmit={handleChangePassword} className="space-y-3 mt-3">
                {[
                  { value: form.old_password, key: 'old_password', placeholder: 'Contraseña actual', show: showOld, toggle: () => setShowOld(!showOld) },
                  { value: form.new_password, key: 'new_password', placeholder: 'Nueva contraseña', show: showNew, toggle: () => setShowNew(!showNew) },
                ].map(({ value, key, placeholder, show, toggle }) => (
                  <div key={key} className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="input-base pr-10"
                      required
                    />
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  placeholder="Confirmar nueva contraseña"
                  className="input-base"
                  required
                />
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="w-full bg-white border border-red-200 text-red-500 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

      <BottomNav role="ESP_" />
    </div>
  )
}