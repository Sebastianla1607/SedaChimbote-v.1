import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Loader, Copy, CheckCircle } from 'lucide-react'
import logo from '../../assets/logo_chimbote.png'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">¡Técnico Creado!</h2>
          <p className="text-gray-500 text-sm mb-6">Entrega estas credenciales de forma segura</p>

          <div className="bg-[#1a237e] rounded-xl p-5 mb-4 text-left space-y-3">
            <p className="text-blue-300 text-xs font-semibold uppercase">Credenciales de Acceso</p>
            {[
              { label: 'Nombre', value: credentials.first_name },
              { label: 'Código', value: credentials.access_code },
              { label: 'Contraseña Temporal', value: credentials.temp_password },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-blue-300 text-xs mb-0.5">{label}</p>
                <p className="text-white font-bold font-mono">{value}</p>
              </div>
            ))}
          </div>

          <button onClick={copyCredentials} className="w-full border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 mb-3 hover:bg-gray-50 transition">
            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar credenciales'}
          </button>

          <button onClick={() => navigate('/admin/dashboard')} className="btn-primary">
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a237e] px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')} className="text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={logo} alt="SEDACHIMBOTE" className="h-8 object-contain" />
        <div>
          <h1 className="text-white font-bold">Nuevo Técnico</h1>
          <p className="text-blue-300 text-xs">Registrar nuevo especialista de campo</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {error && <div className="alert-error mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Nombres <span className="text-red-400">*</span></label>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Nombres del técnico" className="input-base" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'last_name_pat', label: 'Ap. Paterno', placeholder: 'Apellido paterno' },
                { key: 'last_name_mat', label: 'Ap. Materno', placeholder: 'Apellido materno' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="label">{label} <span className="text-red-400">*</span></label>
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      form.specialties.includes(s.id)
                        ? 'bg-[#1a237e] text-white border-[#1a237e]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#1a237e]'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">Credenciales automáticas</p>
              <p className="text-xs text-blue-600">El sistema generará código y contraseña temporal automáticamente.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Crear Técnico'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}