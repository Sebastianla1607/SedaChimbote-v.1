import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import Logo from '../../components/ui/Logo'
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Orbes brillantes decorativos */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-fade-in-up">
        {/* Contenedor con borde degradado de 1px brillante */}
        <div className="p-[1px] rounded-[2rem] bg-gradient-to-br from-indigo-500 via-blue-500/20 to-cyan-500 shadow-2xl">
          <div className="bg-slate-900/90 rounded-[1.95rem] overflow-hidden border border-slate-800/80 backdrop-blur-md">

            {/* Cabecera */}
            <div className="bg-slate-950/40 border-b border-slate-800/60 px-6 pt-8 pb-6 flex flex-col items-center relative">
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              <Logo size="md" className="mb-2.5 z-10" />
              <h1 className="text-white text-xl font-black uppercase tracking-wide z-10">Registro de Ciudadano</h1>
              <p className="text-slate-400 text-xs mt-1 text-center font-semibold z-10">
                Complete sus datos para acceder a los servicios digitales
              </p>

              {/* Steps Visualizer */}
              <div className="flex items-center gap-3 mt-4.5 z-10">
                {[{ n: 1, label: 'Suministro' }, { n: 2, label: 'Datos' }].map(({ n, label }, i) => (
                  <div key={n} className="flex items-center gap-3">
                    {i > 0 && <div className="w-8 h-px bg-slate-800" />}
                    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${step === n ? 'text-white' : 'text-slate-500'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold ${step === n ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>{n}</span>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-6">
              {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl px-4 py-3 text-xs font-semibold mb-4">{error}</div>}

              {/* PASO 1 */}
              {step === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); handleValidate() }} className="space-y-4">
                  <div>
                    <label className="label">N° de Suministro <span className="text-rose-500">*</span></label>
                    <input name="supply_code" value={form.supply_code} onChange={handleChange}
                      placeholder="Ej. SUM-001" className="input-base" required />
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Encuéntralo en tu recibo de agua</p>
                  </div>
                  <div>
                    <label className="label">Referencia de Cobro <span className="text-rose-500">*</span></label>
                    <input name="reference_amount" value={form.reference_amount} onChange={handleChange}
                      placeholder="Ej. 45.50" type="number" step="0.01" className="input-base" required />
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Monto total de tu último recibo de cobro</p>
                  </div>
                  <button type="submit" className="w-full btn-primary mt-2">
                    Validar Suministro →
                  </button>
                </form>
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
                      <div className="flex gap-2 items-stretch">
                        <input
                          name="doc_number"
                          value={form.doc_number}
                          onChange={handleChange}
                          placeholder="12345678"
                          maxLength={8}
                          className="input-base flex-1"
                          required
                        />
                        {form.doc_type === 'DNI' && (
                          <button
                            type="button"
                            onClick={handleConsultDni}
                            disabled={loadingDni}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 rounded-xl flex items-center justify-center disabled:opacity-50 transition active:scale-[0.98] whitespace-nowrap"
                          >
                            {loadingDni ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
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
                      {loading ? <Loader className="w-4 h-4 animate-spin mx-auto text-white" /> : 'Crear Cuenta'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-slate-950/40 border-t border-slate-800/80 px-6 py-4">
              <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-extrabold hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}