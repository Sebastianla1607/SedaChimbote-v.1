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
    fetchSpecialties()
  }, [])

  const fetchSpecialties = async () => {
    try {
      const { data } = await api.get('/specialties')
      setSpecialties(data.specialties)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleSpecialty = (id) => {
    if (form.specialties.includes(id)) {
      setForm({ ...form, specialties: form.specialties.filter(s => s !== id) })
    } else {
      setForm({ ...form, specialties: [...form.specialties, id] })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/users', {
        role: 'ESP_',
        first_name: form.first_name,
        last_name_pat: form.last_name_pat,
        last_name_mat: form.last_name_mat,
        phone: form.phone,
        specialties: form.specialties
      })
      setCredentials(data.user)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el técnico')
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    const text = `CREDENCIALES SEDACHIMBOTE\nCódigo: ${credentials.access_code}\nContraseña: ${credentials.temp_password}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Pantalla de credenciales generadas
  if (credentials) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">¡Técnico Creado!</h2>
          <p className="text-gray-500 text-sm mb-6">Entrega estas credenciales al técnico de forma segura</p>

          <div className="bg-[#1a237e] rounded-xl p-5 mb-4 text-left">
            <p className="text-blue-300 text-xs font-semibold mb-3 uppercase">Credenciales de Acceso</p>
            <div className="space-y-3">
              <div>
                <p className="text-blue-300 text-xs mb-0.5">Nombre</p>
                <p className="text-white font-semibold">{credentials.first_name}</p>
              </div>
              <div>
                <p className="text-blue-300 text-xs mb-0.5">Código de Acceso</p>
                <p className="text-white font-bold text-lg font-mono">{credentials.access_code}</p>
              </div>
              <div>
                <p className="text-blue-300 text-xs mb-0.5">Contraseña Temporal</p>
                <p className="text-white font-bold text-lg font-mono">{credentials.temp_password}</p>
              </div>
            </div>
          </div>

          <button
            onClick={copyCredentials}
            className="w-full border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 mb-3 hover:bg-gray-50 transition"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar credenciales'}
          </button>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full bg-[#1a237e] text-white font-semibold py-2.5 rounded-xl text-sm"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Nombres <span className="text-red-400">*</span>
              </label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Nombres del técnico"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Ap. Paterno <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.last_name_pat}
                  onChange={(e) => setForm({ ...form, last_name_pat: e.target.value })}
                  placeholder="Apellido paterno"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Ap. Materno <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.last_name_mat}
                  onChange={(e) => setForm({ ...form, last_name_mat: e.target.value })}
                  placeholder="Apellido materno"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Teléfono
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="999 999 999"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
              />
            </div>

            {/* Especialidades */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Especialidades
              </label>
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

            {/* Nota */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">Credenciales automáticas</p>
              <p className="text-xs text-blue-600">El sistema generará automáticamente un código de acceso y contraseña temporal que deberás entregar al técnico.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 flex-grow bg-[#1a237e] hover:bg-[#283593] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creando...' : 'Crear Técnico'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}