import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, MapPin, Loader } from 'lucide-react'
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
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [specsRes, techsRes] = await Promise.all([
        api.get('/specialties'),
        api.get('/users?role=ESP_')
      ])
      setSpecialties(specsRes.data.specialties)
      setTechs(techsRes.data.users.filter(t => t.is_active))
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#1a237e] px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')} className="text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={logo} alt="SEDACHIMBOTE" className="h-8 object-contain" />
        <div>
          <h1 className="text-white font-bold">Nueva Orden de Trabajo</h1>
          <p className="text-blue-300 text-xs">Complete los detalles para asignar esta actividad</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Descripción */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Descripción Técnica <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Detalla los síntomas, ubicación exacta y herramientas requeridas..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] resize-none"
                required
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Dirección <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Ej. Av. José Gálvez 450, Chimbote"
                  className="w-full pl-9 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                  required
                />
              </div>
            </div>

            {/* Coordenadas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Latitud <span className="text-gray-400">(Opcional)</span>
                </label>
                <input
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="-9.0734"
                  type="number"
                  step="any"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Longitud <span className="text-gray-400">(Opcional)</span>
                </label>
                <input
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="-78.5912"
                  type="number"
                  step="any"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                />
              </div>
            </div>

            {/* Categoría y Prioridad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Categoría
                </label>
                <select
                  name="specialty_id"
                  value={form.specialty_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                >
                  <option value="">Seleccione categoría</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Prioridad <span className="text-red-400">*</span>
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="EXTREMA">Extrema</option>
                </select>
              </div>
            </div>

            {/* Técnico */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Especialista Asignado
              </label>
              <select
                name="assigned_esp_id"
                value={form.assigned_esp_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
              >
                <option value="">Asignación automática por sistema</option>
                {techs.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.access_code} — {t.first_name} {t.last_name_pat} {t.is_wip_locked ? '(En tarea)' : '(Disponible)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Nota del sistema */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-0.5">Nota del Sistema</p>
                <p className="text-xs text-blue-600">Este ticket de creación manual omite el motor de triaje con Inteligencia Artificial, ya que se asume prioridad y categorización por criterio del administrador.</p>
              </div>
            </div>

            {/* Botones */}
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
                {loading ? 'Creando...' : 'Crear Orden de Trabajo'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}