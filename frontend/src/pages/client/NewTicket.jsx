import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { uploadSingleImage } from '../../services/api'
import { ArrowLeft, Camera, X, Loader, CheckCircle, AlertTriangle, RefreshCw, XCircle } from 'lucide-react'
import { generateTicketPDF } from '../../services/pdfGenerator'
import { Download } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'

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
  const [imageFiles, setImageFiles] = useState([])
  const [imageBase64, setImageBase64] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      images.forEach(url => URL.revokeObjectURL(url))
    }
  }, [images])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 3) {
      return setError('Máximo 3 fotos')
    }
    const previews = files.map(f => URL.createObjectURL(f))
    setImages([...images, ...previews])
    setImageFiles([...imageFiles, ...files])

    // Convertir primera imagen a base64 para Gemini
    const reader = new FileReader()
    reader.onload = () => setImageBase64(reader.result.split(',')[1])
    reader.readAsDataURL(files[0])
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index])
    setImages(images.filter((_, i) => i !== index))
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    if (index === 0) setImageBase64(null)
  }

  const handleSubmit = async () => {
    if (!form.description || form.description.length < 10) {
      return setError('La descripción debe tener al menos 10 caracteres')
    }
    setError('')
    setLoading(true)
    setPhase(0)


    // Subir imagen y analizar en paralelo con la animación
    const apiPromise = (async () => {
      let imageUrl = null
      if (imageFiles.length > 0) {
        imageUrl = await uploadSingleImage(imageFiles[0])
      }

      const response = await api.post('/triage/analyze', {
        description: form.description,
        reference_point: form.reference_point,
        imageBase64: imageBase64 || null,
        imageUrl
      })
      return response
    })()

    // Avanzar fases con tiempos definidos independientemente de la API
    const phaseDurations = [1200, 1000, 1000, 900, 800] // duración en ms para cada fase
    let currentPhase = 0

    const advancePhase = () => {
      if (currentPhase < PHASES.length - 1) {
        currentPhase++
        setPhase(currentPhase)
        setTimeout(advancePhase, phaseDurations[currentPhase])
      }
    }
    setTimeout(advancePhase, phaseDurations[0])

    // Esperar mínimo 5 segundos aunque la API responda antes
    const minWait = new Promise(resolve => setTimeout(resolve, 5000))

    try {
      const [{ data }] = await Promise.all([apiPromise, minWait])
      // Asegurarse que llegamos a la última fase
      setPhase(PHASES.length - 1)
      await new Promise(resolve => setTimeout(resolve, 600))
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el reclamo')
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de procesando
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Decorative Orbits */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/25 rounded-full flex items-center justify-center mb-6 animate-pulse z-10">
          <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-extrabold mb-2 z-10">Gemini IA Analizando</h2>
        <p className="text-slate-400 text-sm mb-8 text-center max-w-xs z-10">Nuestro sistema inteligente está procesando y categorizando tu reclamo</p>

        <div className="w-full max-w-xs space-y-3 z-10 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
          {PHASES.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= phase ? 'opacity-100' : 'opacity-25'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < phase ? 'bg-emerald-500' : i === phase ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'}`}>
                {i < phase ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className={`text-xs font-bold ${i <= phase ? 'text-slate-100' : 'text-slate-600'}`}>{p}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl z-10">
          <p className="text-slate-500 text-xs font-mono font-bold">SEDA-AC-04</p>
        </div>
      </div>
    )
  }

  // Pantalla de resultado
  if (result) {
    if (result.resultado === 'APROBADO') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Decorative Orbits */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="card text-center p-8 w-full max-w-sm z-10">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-slate-100 mb-2">¡Reclamo Registrado!</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{result.mensaje}</p>

            <div className="bg-[#1a237e] rounded-2xl p-4 mb-6 shadow-inner">
              <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">CÓDIGO DE SEGUIMIENTO</p>
              <p className="text-white font-black text-lg font-mono tracking-wider">{result.ticket?.code}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">CATEGORÍA</p>
                <p className="text-xs font-bold text-slate-200">{result.ticket?.ai_category || 'General'}</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">PRIORIDAD</p>
                <p className="text-xs font-bold text-slate-200">{result.ticket?.priority}</p>
              </div>
            </div>

            {/* Botón descargar PDF */}
            <button
              onClick={() => generateTicketPDF({
                ...result.ticket,
                description: form.description,
                reference_point: form.reference_point,
                address: 'Ver en sistema',
                origin: 'CIUDADANO'
              })}
              className="w-full btn-secondary text-blue-400 border-blue-500/30 hover:bg-blue-500/10 mb-3 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar comprobante PDF
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full btn-primary"
            >
              Ver mis reclamos
            </button>
          </div>
        </div>
      )
    }

    if (result.resultado === 'RECHAZADO') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Decorative Orbits */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="card text-center p-8 w-full max-w-sm z-10">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-slate-100 mb-2">Reclamo No Procedente</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{result.mensaje}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full btn-primary"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }

    if (result.resultado === 'NECESITA_MAS_INFO') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Decorative Orbits */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="card text-center p-8 w-full max-w-sm z-10">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-100 mb-2">Necesitamos más información</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{result.mensaje}</p>
            <button
              onClick={() => setResult(null)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Agregar más detalles
            </button>
          </div>
        </div>
      )
    }
  }

  // Formulario principal
  return (
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Decorative Orbits */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col w-full z-10">

      {/* Header */}
      <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-4 flex items-center gap-3 md:px-8 md:py-6">
        <button onClick={() => navigate('/dashboard')} className="text-white hover:text-slate-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-extrabold text-lg">Nuevo Reclamo</h1>
          <p className="text-slate-400 text-xs font-semibold">Describe el problema del servicio de agua o alcantarillado</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-6 md:py-8 max-w-5xl w-full mx-auto">

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl px-4 py-3.5 text-sm font-semibold mb-6 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">
          
          {/* Columna Principal (Formulario) */}
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            
            {/* Descripción */}
            <div className="card border border-slate-800/60 shadow-xl bg-slate-900/50">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Descripción del problema <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe el problema con el mayor detalle posible para facilitar el análisis de la IA..."
                rows={6}
                className="w-full text-sm md:text-base text-slate-100 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
              />
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-500 font-medium">Recomendado: Añadir detalles visuales o ruidos</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${form.description.length < 10 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {form.description.length} / 500
                </span>
              </div>
            </div>

            {/* Punto de referencia */}
            <div className="card border border-slate-800/60 shadow-xl bg-slate-900/50">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Punto de Referencia <span className="text-slate-500 font-normal capitalize tracking-normal">(Opcional)</span>
              </label>
              <input
                value={form.reference_point}
                onChange={(e) => setForm({ ...form, reference_point: e.target.value })}
                placeholder="Ej. Casa color rosada con reja negra frente a parque"
                className="w-full text-sm md:text-base text-slate-100 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
              />
            </div>

          </div>

          {/* Columna Secundaria (Adjuntos e IA) */}
          <div className="space-y-5 md:space-y-6">
            
            {/* Evidencia fotográfica */}
            <div className="card border border-slate-800/60 shadow-xl bg-slate-900/50">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Evidencia Visual <span className="text-slate-500 font-normal capitalize tracking-normal">(Opcional)</span>
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={img} className="w-full h-full object-cover rounded-xl border-2 border-slate-800/80 shadow-md" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.5)] active:scale-90 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 3 && (
                <label className="border-2 border-dashed border-slate-700/80 bg-slate-950/40 hover:bg-slate-800/60 rounded-2xl p-6 cursor-pointer hover:border-blue-500/60 transition-all flex flex-col items-center justify-center text-center group">
                  <div className="w-12 h-12 bg-slate-800/50 group-hover:bg-blue-500/20 rounded-full flex items-center justify-center mb-3 transition-colors">
                    <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-sm text-slate-300 font-bold group-hover:text-blue-300">Añadir foto</span>
                  <span className="text-xs text-slate-500 mt-1.5">Soporta JPG, PNG</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>

            {/* Nota de IA */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-extrabold text-blue-400 mb-1.5">Sistema Inteligente Gemini IA</p>
                <p className="text-xs text-blue-200/70 leading-relaxed font-medium">Tu reclamo será analizado en tiempo real por la IA para determinar la categoría, urgencia, y asignar al operario adecuado automáticamente.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="px-4 py-4 bg-slate-900/90 border-t border-slate-800/80 flex gap-3 md:justify-end md:px-8 backdrop-blur-md">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 md:flex-none md:w-32 btn-secondary"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="flex-2 flex-grow md:flex-none md:w-48 btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Enviar Reclamo
        </button>
      </div>

      </div>
    </div>
  )
}