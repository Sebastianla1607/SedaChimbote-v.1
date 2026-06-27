import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import logo from '../../assets/logo_chimbote.png'
import { Loader } from 'lucide-react'

const FIELDS_STEP2 = [
  { name: 'first_name', label: 'Nombres', placeholder: 'Sus nombres', colSpan: 'full' },
  { name: 'last_name_pat', label: 'Ap. Paterno', placeholder: 'Apellido paterno' },
  { name: 'last_name_mat', label: 'Ap. Materno', placeholder: 'Apellido materno' },
  { name: 'phone', label: 'Teléfono', placeholder: '999 999 999', colSpan: 'full', required: false },
  { name: 'email', label: 'Correo Electrónico', placeholder: 'correo@ejemplo.com', type: 'email', colSpan: 'full' },
]

export default function Register() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    supply_code: '', reference_amount: '', doc_type: 'DNI',
    doc_number: '', first_name: '', last_name_pat: '',
    last_name_mat: '', phone: '', email: '',
    password: '', confirm_password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDni, setLoadingDni] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleValidate = () => {
    if (!form.supply_code || !form.reference_amount) {
      return setError('Ingresa el N° de suministro y la referencia de cobro')
    }
    setError('')
    setStep(2)
  }

  const handleConsultDni = async () => {
    if (form.doc_number.length !== 8) return setError('El DNI debe tener 8 dígitos')
    setLoadingDni(true)
    setError('')
    try {
      const { data } = await api.get(`/auth/consultar-dni/${form.doc_number}`)
      setForm({
        ...form,
        first_name: data.nombres || '',
        last_name_pat: data.apellidoPaterno || '',
        last_name_mat: data.apellidoMaterno || ''
      })
    } catch (err) {
      setError('No se pudo consultar el DNI, ingresa los datos manualmente')
    } finally {
      setLoadingDni(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) return setError('Las contraseñas no coinciden')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        supply_code: form.supply_code,
        reference_amount: parseFloat(form.reference_amount),
        doc_type: form.doc_type,
        doc_number: form.doc_number,
        first_name: form.first_name,
        last_name_pat: form.last_name_pat,
        last_name_mat: form.last_name_mat,
        phone: form.phone,
        email: form.email,
        password: form.password
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-[#1a237e] px-6 pt-6 pb-5 flex flex-col items-center">
            <img src={logo} alt="SEDACHIMBOTE" className="h-16 object-contain mb-2" />
            <h1 className="text-white text-lg font-bold">Registro de Ciudadano</h1>
            <p className="text-blue-200 text-xs mt-1 text-center">
              Complete sus datos para acceder a los servicios digitales
            </p>

            {/* Steps */}
            <div className="flex items-center gap-3 mt-4">
              {[{ n: 1, label: 'Suministro' }, { n: 2, label: 'Datos personales' }].map(({ n, label }, i) => (
                <div key={n} className="flex items-center gap-3">
                  {i > 0 && <div className="w-8 h-px bg-blue-400" />}
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === n ? 'text-white' : 'text-blue-300'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === n ? 'bg-white text-[#1a237e]' : 'bg-blue-700 text-blue-300'}`}>{n}</span>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="alert-error mb-4">{error}</div>}

            {/* PASO 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="label">N° de Suministro <span className="text-red-400">*</span></label>
                  <input name="supply_code" value={form.supply_code} onChange={handleChange}
                    placeholder="Ej. SUM-001" className="input-base" />
                  <p className="text-xs text-gray-400 mt-1">Encuéntralo en tu recibo de agua</p>
                </div>
                <div>
                  <label className="label">Referencia de Cobro <span className="text-red-400">*</span></label>
                  <input name="reference_amount" value={form.reference_amount} onChange={handleChange}
                    placeholder="Ej. 45.50" type="number" step="0.01" className="input-base" />
                  <p className="text-xs text-gray-400 mt-1">Monto total de tu último recibo</p>
                </div>
                <button onClick={handleValidate} className="btn-primary">
                  Validar →
                </button>
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Tipo y número de documento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tipo Doc.</label>
                    <select name="doc_type" value={form.doc_type} onChange={handleChange} className="input-base">
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">N° Documento</label>
                    <div className="flex gap-2">
                      <input
                        name="doc_number"
                        value={form.doc_number}
                        onChange={handleChange}
                        placeholder="12345678"
                        maxLength={8}
                        className="input-base"
                        required
                      />
                      {form.doc_type === 'DNI' && (
                        <button
                          type="button"
                          onClick={handleConsultDni}
                          disabled={loadingDni}
                          className="bg-[#1a237e] text-white text-xs px-2 rounded-lg flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
                        >
                          {loadingDni ? <Loader className="w-3 h-3 animate-spin" /> : '🔍'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Campos personales */}
                <div className="grid grid-cols-2 gap-3">
                  {FIELDS_STEP2.map(({ name, label, placeholder, type, colSpan, required = true }) => (
                    <div key={name} className={colSpan === 'full' ? 'col-span-2' : ''}>
                      <label className="label">{label}</label>
                      <input
                        name={name}
                        type={type || 'text'}
                        value={form[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="input-base"
                        required={required}
                      />
                    </div>
                  ))}
                </div>

                {/* Contraseñas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Contraseña</label>
                    <input name="password" type="password" value={form.password}
                      onChange={handleChange} placeholder="••••••••" className="input-base" required />
                  </div>
                  <div>
                    <label className="label">Confirmar</label>
                    <input name="confirm_password" type="password" value={form.confirm_password}
                      onChange={handleChange} placeholder="••••••••" className="input-base" required />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                    ← Atrás
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Crear cuenta'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
            <p className="text-center text-xs text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#1a237e] font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}