import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Loader, MapPin } from 'lucide-react'
import logo from '../../assets/logo_chimbote.png'

export default function AdminNewTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    priority: 'MEDIA',
    specialty_id: '',
    assigned_esp_id: ''
  })
  const [specialties, setSpecialties] = useState([])
  const [techs, setTechs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const [specsRes, techsRes] = await Promise.all([
        api.get('/specialties'),
        api.get('/users?role=ESP_')
      ])
      setSpecialties(specsRes.data.specialties)
      setTechs(techsRes.data.users.filter(t => t.is_active))
    }
    fetchData()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/admin/tickets', {
        description: form.description,
        address: form.address,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        priority: form.priority,
        specialty_id: form.specialty_id ? parseInt(form.specialty_id) : null,
        assigned_esp_id: form.assigned_esp_id ? parseInt(form.assigned_esp_id) : null
      })
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el ticket')
    } finally {
      setLoading(false)
    }
  }

  const selectClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a237e] px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')} className="text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={logo} alt="SEDACHIMBOTE" className="h-8 object-contain" />
        <div>
          <h1 className="text-white font-bold">Nueva Orden de Trabajo</h1>
          <p className="text-blue-300 text-xs">Complete los detalles técnicos</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {error && <div className="alert-error mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="label">Descripción Técnica <span className="text-red-400">*</span></label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Detalla los síntomas, ubicación exacta y herramientas requeridas..."
                rows={4}
                className="input-base resize-none"
                required
              />
            </div>

            <div>
              <label className="label">Dirección <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Ej. Av. José Gálvez 450, Chimbote"
                  className="input-base pl-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'latitude', label: 'Latitud', placeholder: '-9.0734' },
                { name: 'longitude', label: 'Longitud', placeholder: '-78.5912' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="label">{label} <span className="text-gray-400">(Opcional)</span></label>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    type="number"
                    step="any"
                    className="input-base"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Categoría</label>
                <select name="specialty_id" value={form.specialty_id} onChange={handleChange} className={selectClass}>
                  <option value="">Seleccione categoría</option>
                  {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Prioridad <span className="text-red-400">*</span></label>
                <select name="priority" value={form.priority} onChange={handleChange} className={selectClass}>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="EXTREMA">Extrema</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Especialista Asignado</label>
              <select name="assigned_esp_id" value={form.assigned_esp_id} onChange={handleChange} className={selectClass}>
                <option value="">Asignación automática por sistema</option>
                {techs.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.access_code} — {t.first_name} {t.last_name_pat} {t.is_wip_locked ? '(En tarea)' : '(Disponible)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-0.5">Nota del Sistema</p>
                <p className="text-xs text-blue-600">Este ticket omite el triaje de IA — la prioridad y categoría son asignadas manualmente.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Crear Orden de Trabajo'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}