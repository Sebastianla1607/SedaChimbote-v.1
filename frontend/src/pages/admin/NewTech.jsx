import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Loader, Copy, CheckCircle } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import Sidebar from '../../components/layout/Sidebar'

export default function NewTech() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name_pat: '',
    last_name_mat: '',
    phone: '',
    specialties: []
  })
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/specialties').then(({ data }) => setSpecialties(data.specialties))
  }, [])

  const toggleSpecialty = (id) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(id)
        ? prev.specialties.filter(s => s !== id)
        : [...prev.specialties, id]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/users', {
        role: 'ESP_',
        ...form
      })
      setCredentials(data.user)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el técnico')
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    navigator.clipboard.writeText(
      `CREDENCIALES SEDACHIMBOTE\nCódigo: ${credentials.access_code}\nContraseña: ${credentials.temp_password}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (credentials) {
    return (
      <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Decorative Orbits */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <Sidebar />
        <div className="flex-1 md:pl-64 flex flex-col w-full z-10">
          {/* Header */}
          <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-4 flex items-center gap-3 md:px-8 md:py-6 sticky top-0 z-40 backdrop-blur-md">
            <button onClick={() => navigate('/admin/dashboard')} className="text-white hover:text-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo size="sm" />
            <div>
              <h1 className="text-white font-extrabold text-lg">Técnico Registrado</h1>
              <p className="text-slate-400 text-xs font-semibold">Detalles de acceso para el especialista</p>
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center p-4">
            <div className="card w-full max-w-md text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm animate-pulse">
                <CheckCircle className="w-8 h-8 text-emerald-450" />
              </div>
              <h2 className="text-xl font-black text-slate-100 mb-1">¡Técnico Creado!</h2>
              <p className="text-slate-400 text-sm mb-6">Entrega estas credenciales de forma segura al operario</p>

              <div className="bg-[#1a237e] rounded-2xl p-5 mb-5 text-left space-y-3 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                <p className="text-blue-300 text-xs font-bold uppercase tracking-wider z-10 relative">Credenciales de Acceso</p>
                {[
                  { label: 'Nombre', value: credentials.first_name },
                  { label: 'Código de Técnico', value: credentials.access_code },
                  { label: 'Contraseña Temporal', value: credentials.temp_password },
                ].map(({ label, value }) => (
                  <div key={label} className="z-10 relative">
                    <p className="text-blue-200/70 text-[10px] uppercase font-bold tracking-wider mb-0.5">{label}</p>
                    <p className="text-white font-black font-mono text-sm tracking-wide">{value}</p>
                  </div>
                ))}
              </div>

              <button onClick={copyCredentials} className="w-full btn-secondary mb-3 flex items-center justify-center gap-2">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar credenciales'}
              </button>

              <button onClick={() => navigate('/admin/dashboard')} className="w-full btn-primary">
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Decorative Orbits */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col w-full z-10">

        {/* Header */}
        <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-4 flex items-center gap-3 md:px-8 md:py-6 sticky top-0 z-40 backdrop-blur-md">
          <button onClick={() => navigate('/admin/dashboard')} className="text-white hover:text-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <div>
            <h1 className="text-white font-extrabold text-lg">Nuevo Técnico</h1>
            <p className="text-slate-400 text-xs font-semibold">Registrar nuevo especialista de campo</p>
          </div>
        </div>

        <div className="max-w-xl w-full mx-auto px-4 py-8 md:px-8">
          <div className="card">
            {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl px-4 py-3.5 text-xs font-semibold mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Nombres <span className="text-rose-500">*</span></label>
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Nombres del técnico" className="input-base" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'last_name_pat', label: 'Ap. Paterno', placeholder: 'Apellido paterno' },
                  { key: 'last_name_mat', label: 'Ap. Materno', placeholder: 'Apellido materno' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="label">{label} <span className="text-rose-500">*</span></label>
                    <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder} className="input-base" required />
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="999 999 999" className="input-base" />
              </div>

              <div>
                <label className="label mb-2">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {specialties.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSpecialty(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        form.specialties.includes(s.id)
                          ? 'bg-blue-600 text-white border-blue-500/20 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-blue-500/50'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <div className="w-6 h-6 bg-blue-600/20 border border-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-blue-400 text-xs font-black">i</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-400 mb-0.5">Credenciales automáticas</p>
                  <p className="text-xs text-slate-300 leading-relaxed">El sistema generará código y contraseña temporal automáticamente para el inicio de sesión del técnico.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader className="w-4 h-4 animate-spin mx-auto text-white" /> : 'Crear Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}