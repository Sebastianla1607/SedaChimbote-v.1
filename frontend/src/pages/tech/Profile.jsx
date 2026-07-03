import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Eye, EyeOff, LogOut, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import MobileHeader from '../../components/layout/MobileHeader'
import BottomNav from '../../components/layout/BottomNav'
import Sidebar from '../../components/layout/Sidebar'

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
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Decorative Orbits */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col mobile-container z-10">
      <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-8 flex flex-col items-center">
        <div className="w-full mb-4">
          <MobileHeader showBack title="Mi Perfil" onBackClick={() => navigate('/tech/dashboard')} />
        </div>
        <div className="w-20 h-20 bg-slate-800 border border-slate-700/50 rounded-full flex items-center justify-center mb-3 shadow-inner">
          <span className="text-white text-3xl font-black">{user?.first_name?.[0]}</span>
        </div>
        <h2 className="text-white text-lg font-black">{user?.first_name}</h2>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">Técnico Especialista</span>
          <span className="bg-emerald-600/20 text-emerald-450 border border-emerald-500/20 text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-wider">{user?.access_code}</span>
        </div>
      </div>

      <div className="flex-grow px-4 py-6 space-y-4 pb-24 md:px-8 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:items-start max-w-4xl w-full mx-auto">

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 md:col-span-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400" />{success}
          </div>
        )}

        {/* Datos */}
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-slate-800/80">
            <p className="label mb-0">Información</p>
          </div>
          <div className="divide-y divide-slate-800/80">
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 font-bold text-sm">{user?.first_name?.[0]}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nombre</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{user?.first_name}</p>
              </div>
            </div>
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Código de acceso</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono tracking-wider">{user?.access_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cambio de contraseña */}
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-slate-800/80">
            <p className="label mb-0">Seguridad</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-slate-900/40 transition"
          >
            <div className="w-8 h-8 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-slate-200">Cambiar contraseña</p>
              <p className="text-xs text-slate-500">Cambia tu contraseña temporal por una segura</p>
            </div>
            <span className="text-slate-500 text-xs">{showForm ? '▲' : '▼'}</span>
          </button>

          {showForm && (
            <div className="px-4 pb-4 border-t border-slate-800/80">
              {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-3 py-2 text-xs font-semibold mt-3 mb-1">{error}</div>}
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
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
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
                <button type="submit" disabled={loading} className="w-full btn-primary">
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="w-full bg-slate-900/60 border border-rose-500/20 text-rose-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-500/10 transition active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

      <BottomNav role="ESP_" />
      </div>
    </div>
  )
}