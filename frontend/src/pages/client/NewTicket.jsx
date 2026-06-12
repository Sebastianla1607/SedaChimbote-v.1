import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Camera, X, Loader, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

const PHASES = [
  'Analizando descripción...',
  'Procesando evidencia visual...',
  'Clasificando tipo de incidencia...',
  'Determinando prioridad...',
  'Generando reporte técnico...',
]

export default function NewTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ description: '', reference_point: '' })
  const [images, setImages] = useState([])
  const [imageBase64, setImageBase64] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 3) {
      return setError('Máximo 3 fotos')
    }
    const previews = files.map(f => URL.createObjectURL(f))
    setImages([...images, ...previews])

    // Convertir primera imagen a base64 para Gemini
    const reader = new FileReader()
    reader.onload = () => setImageBase64(reader.result.split(',')[1])
    reader.readAsDataURL(files[0])
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    if (index === 0) setImageBase64(null)
  }

  const handleSubmit = async () => {
    if (!form.description || form.description.length < 10) {
      return setError('La descripción debe tener al menos 10 caracteres')
    }
    setError('')
    setLoading(true)
    setPhase(0)

    // Simular fases de análisis
    const interval = setInterval(() => {
      setPhase(prev => {
        if (prev < PHASES.length - 1) return prev + 1
        clearInterval(interval)
        return prev
      })
    }, 800)

    try {
      const { data } = await api.post('/triage/analyze', {
        description: form.description,
        reference_point: form.reference_point,
        imageBase64: imageBase64 || null
      })
      clearInterval(interval)
      setResult(data)
    } catch (err) {
      clearInterval(interval)
      setError(err.response?.data?.error || 'Error al procesar el reclamo')
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de procesando
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a237e] flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Gemini IA Analizando</h2>
        <p className="text-blue-300 text-sm mb-8 text-center">Nuestro sistema inteligente está procesando tu reclamo</p>

        <div className="w-full max-w-xs space-y-3">
          {PHASES.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= phase ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < phase ? 'bg-green-400' : i === phase ? 'bg-blue-400 animate-pulse' : 'bg-blue-800'}`}>
                {i < phase ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className={`text-sm ${i <= phase ? 'text-white' : 'text-blue-600'}`}>{p}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-800 rounded-xl px-4 py-2">
          <p className="text-blue-300 text-xs font-mono">SEDA-AC-04</p>
        </div>
      </div>
    )
  }

  // Pantalla de resultado
  if (result) {
    if (result.resultado === 'APROBADO') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">¡Reclamo Registrado!</h2>
            <p className="text-gray-500 text-sm mb-6">{result.mensaje}</p>

            <div className="bg-[#1a237e] rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-xs font-semibold mb-1">CÓDIGO DE SEGUIMIENTO</p>
              <p className="text-white font-bold text-lg font-mono">{result.ticket?.code}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-semibold mb-1">CATEGORÍA</p>
                <p className="text-sm font-semibold text-gray-800">{result.ticket?.ai_category || 'General'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-semibold mb-1">PRIORIDAD</p>
                <p className="text-sm font-semibold text-gray-800">{result.ticket?.priority}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#1a237e] text-white font-semibold py-3 rounded-xl"
            >
              Ver mis reclamos
            </button>
          </div>
        </div>
      )
    }

    if (result.resultado === 'RECHAZADO') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Reclamo No Procedente</h2>
            <p className="text-gray-500 text-sm mb-6">{result.mensaje}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#1a237e] text-white font-semibold py-3 rounded-xl"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }

    if (result.resultado === 'NECESITA_MAS_INFO') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Necesitamos más información</h2>
            <p className="text-gray-500 text-sm mb-6">{result.mensaje}</p>
            <button
              onClick={() => setResult(null)}
              className="w-full bg-[#1a237e] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Agregar más detalles
            </button>
          </div>
        </div>
      )
    }
  }

  // Formulario principal
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* Header */}
      <div className="bg-[#1a237e] px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-bold">Nuevo Reclamo</h1>
          <p className="text-blue-300 text-xs">Describe el problema del servicio</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Descripción */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Descripción del problema <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe el problema con el mayor detalle posible para facilitar el análisis de la IA..."
            rows={4}
            className="w-full text-sm text-gray-700 resize-none focus:outline-none"
          />
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Mínimo 10 caracteres</span>
            <span className={`text-xs font-semibold ${form.description.length < 10 ? 'text-red-400' : 'text-green-500'}`}>
              {form.description.length} / 500
            </span>
          </div>
        </div>

        {/* Evidencia fotográfica */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Evidencia Visual <span className="text-gray-400">(Opcional)</span>
          </label>

          {images.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 3 && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer hover:border-[#1a237e] transition">
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 font-medium">Arrastra fotos aquí o haz clic</span>
              <span className="text-xs text-gray-400 mt-1">Soporta JPG, PNG (Máx 5MB)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {/* Punto de referencia */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Punto de Referencia <span className="text-gray-400">(Opcional)</span>
          </label>
          <input
            value={form.reference_point}
            onChange={(e) => setForm({ ...form, reference_point: e.target.value })}
            placeholder="Ej. Casa color rosada con reja negra"
            className="w-full text-sm text-gray-700 focus:outline-none"
          />
        </div>

        {/* Nota de IA */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-0.5">Sistema Inteligente Activo</p>
            <p className="text-xs text-blue-600">Tu reclamo será analizado por Gemini IA para clasificarlo y asignarlo al técnico más adecuado.</p>
          </div>
        </div>

      </div>

      {/* Botones */}
      <div className="px-4 py-4 bg-white border-t border-gray-200 flex gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="flex-2 flex-grow bg-[#1a237e] text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Enviar Reclamo
        </button>
      </div>

    </div>
  )
}