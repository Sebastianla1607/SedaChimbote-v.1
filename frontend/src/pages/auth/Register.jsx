import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import logo from '../../assets/logo_chimbote.png'

export default function Register() {
  const [step, setStep] = useState(1)
  const [validated, setValidated] = useState(false)
  const [form, setForm] = useState({
    supply_code: '',
    reference_amount: '',
    doc_type: 'DNI',
    doc_number: '',
    first_name: '',
    last_name_pat: '',
    last_name_mat: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleValidate = async () => {
    if (!form.supply_code || !form.reference_amount) {
      return setError('Ingresa el N° de suministro y la referencia de cobro')
    }
    setError('')
    setValidated(true)
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      return setError('Las contraseñas no coinciden')
    }
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
              Complete sus datos para acceder a los servicios digitales de SEDACHIMBOTE.
            </p>

            {/* Steps */}
            <div className="flex items-center gap-3 mt-4">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 1 ? 'text-white' : 'text-blue-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-white text-[#1a237e]' : 'bg-blue-400 text-white'}`}>1</span>
                Suministro
              </div>
              <div className="w-8 h-px bg-blue-400" />
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 2 ? 'text-white' : 'text-blue-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-white text-[#1a237e]' : 'bg-blue-700 text-blue-300'}`}>2</span>
                Datos personales
              </div>
            </div>
          </div>

          <div className="px-6 py-6">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            {/* PASO 1 — Validar suministro */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    N° de Suministro <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="supply_code"
                    value={form.supply_code}
                    onChange={handleChange}
                    placeholder="Ej. SUM-001"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Encuéntralo en tu recibo de agua</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Referencia de Cobro <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="reference_amount"
                    value={form.reference_amount}
                    onChange={handleChange}
                    placeholder="Ej. 45.50"
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Monto total de tu último recibo</p>
                </div>

                <button
                  onClick={handleValidate}
                  className="w-full bg-[#1a237e] hover:bg-[#283593] text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Validar
                </button>
              </div>
            )}

            {/* PASO 2 — Datos personales */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo Doc.</label>
                    <select
                      name="doc_type"
                      value={form.doc_type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">N° Documento</label>
                    <input
                      name="doc_number"
                      value={form.doc_number}
                      onChange={handleChange}
                      placeholder="12345678"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombres</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Sus nombres"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ap. Paterno</label>
                    <input
                      name="last_name_pat"
                      value={form.last_name_pat}
                      onChange={handleChange}
                      placeholder="Apellido"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ap. Materno</label>
                    <input
                      name="last_name_mat"
                      value={form.last_name_mat}
                      onChange={handleChange}
                      placeholder="Apellido"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono / Celular</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="999 999 999"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contraseña</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirmar</label>
                    <input
                      name="confirm_password"
                      type="password"
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-2 flex-grow bg-[#1a237e] hover:bg-[#283593] text-white font-semibold py-2.5 rounded-lg transition text-sm disabled:opacity-50"
                  >
                    {loading ? 'Registrando...' : 'Crear cuenta'}
                  </button>
                </div>

              </form>
            )}

          </div>

          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
            <p className="text-center text-xs text-gray-400">
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