import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Loader, MapPin } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import Sidebar from '../../components/layout/Sidebar'

export default function AdminNewTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    reference_point: '',
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
        reference_point: form.reference_point || null,
        address: form.address,
        latitude: form.latitude && form.latitude.trim() !== '' ? parseFloat(form.latitude) : null,
        longitude: form.longitude && form.longitude.trim() !== '' ? parseFloat(form.longitude) : null,
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

  const selectClass = "input-base"

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
            <h1 className="text-white font-extrabold text-lg">Nueva Orden de Trabajo</h1>
            <p className="text-slate-400 text-xs font-semibold">Complete los detalles técnicos</p>
          </div>
        </div>

        <div className="max-w-2xl w-full mx-auto px-4 py-8 md:px-8">
          <div className="card">
            {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl px-4 py-3.5 text-xs font-semibold mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="label">Descripción Técnica <span className="text-rose-500">*</span></label>
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
                <label className="label">Dirección <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Ej. Av. José Gálvez 450, Chimbote"
                    className="input-base pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Punto de Referencia <span className="text-slate-550 font-normal">(Opcional)</span></label>
                <input
                  name="reference_point"
                  value={form.reference_point}
                  onChange={handleChange}
                  placeholder="Ej. Casa color verde frente a parque"
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'latitude', label: 'Latitud', placeholder: '-9.0734' },
                  { name: 'longitude', label: 'Longitud', placeholder: '-78.5912' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="label">{label} <span className="text-slate-550 font-normal">(Opcional)</span></label>
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
                  <label className="label">Prioridad <span className="text-rose-500">*</span></label>
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
                  <option value="">Dejar como PENDIENTE (sin asignar)</option>
                  {techs.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.access_code} — {t.first_name} {t.last_name_pat} {t.is_wip_locked ? '(En tarea)' : '(Disponible)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <div className="w-6 h-6 bg-blue-600/20 border border-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-blue-400 text-xs font-black">i</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-400 mb-0.5">Nota del Sistema</p>
                  <p className="text-xs text-slate-300 leading-relaxed">Este ticket omite el triaje de IA — la prioridad y categoría son asignadas manualmente por el administrador.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader className="w-4 h-4 animate-spin mx-auto text-white" /> : 'Crear Orden de Trabajo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}