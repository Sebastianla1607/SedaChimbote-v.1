import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, Camera, X, Loader } from 'lucide-react'
import TechMap from '../../components/TechMap'
import { uploadImages } from '../../services/api'
import Sidebar from '../../components/layout/Sidebar'
import { PriorityBadge } from '../../components/ui/StatusBadge'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAbsentForm, setShowAbsentForm] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [absentNote, setAbsentNote] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportImages, setReportImages] = useState([])

  // ✅ Polling cada 5 segundos
  useEffect(() => {
    fetchTicket()
    const interval = setInterval(fetchTicket, 5000)
    return () => clearInterval(interval)
  }, [id])

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`)
      setTicket(data.ticket)
    } catch (err) {
      setError('No se pudo cargar el ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, body = {}) => {
    setActionLoading(true)
    setError('')
    try {
      if (action === 'start') await api.patch(`/tech/tickets/${id}/start`, {})
      if (action === 'go') await api.patch(`/tech/tickets/${id}/go`, {})
      if (action === 'arrived') await api.patch(`/tech/tickets/${id}/arrived`, {})
      if (action === 'execute') await api.patch(`/tech/tickets/${id}/execute`, {})
      if (action === 'absent') await api.patch(`/tech/tickets/${id}/absent`, body)
      if (action === 'report') await api.post(`/tech/tickets/${id}/report`, body)
      await fetchTicket()
      setShowAbsentForm(false)
      setShowReportForm(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al realizar la acción')
    } finally {
      setActionLoading(false)
    }
  }

  const openMaps = () => {
    if (ticket?.latitude && ticket?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${ticket.latitude},${ticket.longitude}`, '_blank')
    }
  }

  // ✅ Detectar estado de confirmación y aceptación desde los logs
  const clientConfirmed = ticket?.logs?.some(l => l.action === 'CLIENTE_EN_CASA')
  const techAccepted = ticket?.logs?.some(l => l.action === 'ASIGNADO' && l.note?.includes('esperando'))
  const techArrived = ticket?.logs?.some(l => l.action === 'TECNICO_AFUERA')

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-8 h-8 text-[#1a237e] animate-spin" />
    </div>
  )

  if (!ticket) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Ticket no encontrado</p>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Decorative Orbits */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col w-full z-10">

        {/* Header con botón de volver bloqueado si está en EN_CAMINO o EJECUCION_ACTIVA */}
        <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-4 flex items-center gap-3 md:px-8 md:py-6 sticky top-0 z-40 backdrop-blur-md">
          <button
            onClick={() => {
              if (['EN_CAMINO', 'EJECUCION_ACTIVA'].includes(ticket.status)) {
                alert('No puedes salir mientras tienes una tarea activa')
                return
              }
              navigate('/tech/dashboard')
            }}
            className={`${['EN_CAMINO', 'EJECUCION_ACTIVA'].includes(ticket.status) ? 'text-blue-500/50 cursor-not-allowed' : 'text-white hover:text-slate-200'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-extrabold text-lg">Detalle de Ticket</h1>
            <p className="text-blue-400 text-xs font-mono font-bold">#{ticket.code}</p>
          </div>
          <PriorityBadge priority={ticket.priority} />
        </div>

        {ticket.priority === 'EXTREMA' && (
          <div className="bg-rose-600 px-4 py-2.5 flex items-center gap-2 animate-pulse shadow-lg z-30">
            <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
            <p className="text-white text-xs font-black uppercase tracking-wider">TIENES UNA TAREA EN CURSO — ATENCIÓN URGENTE</p>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl px-4 py-3.5 text-sm z-30 font-semibold">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-6 pb-48 md:px-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Col 1: Información del Ticket, IA y Ubicación */}
            <div className="space-y-4">

              {/* Descripción */}
              <div className="card">
                <p className="label mb-2">Descripción del Cliente</p>
                <p className="text-sm text-slate-100 italic font-semibold">"{ticket.description}"</p>
                {ticket.reference_point && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
                    <p className="label mb-1">Punto de Referencia</p>
                    <p className="text-sm text-slate-300 font-semibold">{ticket.reference_point}</p>
                  </div>
                )}
              </div>

              {/* Análisis IA */}
              {ticket.ai_report && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600/20 border border-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 text-xs font-black">IA</span>
                    </div>
                    <p className="text-xs font-bold text-blue-400">Análisis de Gemini IA</p>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{ticket.ai_report}</p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {ticket.ai_category && (
                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                        <p className="label mb-0.5">Categoría</p>
                        <p className="text-sm font-bold text-slate-200">{ticket.ai_category}</p>
                      </div>
                    )}
                    {ticket.ai_difficulty && (
                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                        <p className="label mb-0.5">Dificultad</p>
                        <p className="text-sm font-bold text-slate-200">{ticket.ai_difficulty}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ubicación con mapa */}
              <div className="card">
                <p className="label mb-2">Ubicación</p>
                <p className="text-sm text-slate-200 font-semibold mb-4 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {ticket.address}
                </p>

                <TechMap
                  clientLat={ticket.latitude}
                  clientLng={ticket.longitude}
                  clientAddress={ticket.address}
                />

                <button
                  onClick={openMaps}
                  className="btn-primary mt-4"
                >
                  <MapPin className="w-4 h-4" />
                  Abrir navegación en Google Maps
                </button>
              </div>

            </div>

            {/* Col 2: Estado, Acciones e Informes */}
            <div className="space-y-4">
              {/* SLA */}
              <div className="card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="label mb-0">Fecha límite</p>
                </div>
                <p className="text-sm font-bold text-slate-100">
                  {new Date(ticket.due_date).toLocaleDateString('es-PE')}
                </p>
              </div>

              {/* ✅ Bloque informativo de espera (sin toggle manual) */}
              {ticket.status === 'ASIGNADO' && techAccepted && !clientConfirmed && ticket.origin === 'CIUDADANO' && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <p className="text-amber-400 font-bold text-sm">Esperando confirmación del cliente</p>
                  </div>
                  <p className="text-slate-300 text-xs">
                    El cliente ha sido notificado. Espera su respuesta para iniciar el viaje.
                  </p>
                </div>
              )}

              {/* Formulario cliente ausente */}
              {showAbsentForm && (
                <div className="card border-orange-500/30">
                  <p className="text-sm font-bold text-slate-100 mb-3">Reportar Cliente Ausente</p>
                  <textarea
                    value={absentNote}
                    onChange={(e) => setAbsentNote(e.target.value)}
                    placeholder="Describe la situación..."
                    rows={3}
                    className="input-base mb-3 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAbsentForm(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAction('absent', { description: absentNote })}
                      disabled={actionLoading}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition active:scale-[0.98]"
                    >
                      {actionLoading ? 'Enviando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}

              {/* ✅ Formulario reporte final — NUEVO BLOQUE SEGÚN CLAUDE */}
              {showReportForm && (
                <div className="card border-emerald-500/30">
                  <p className="text-sm font-bold text-slate-100 mb-3">Reporte Final de Trabajo</p>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Describe el trabajo realizado..."
                    rows={3}
                    className="input-base mb-3 resize-none"
                  />
                  <label className="border-2 border-dashed border-slate-700 rounded-2xl py-4 cursor-pointer mb-3 bg-slate-950/40 hover:bg-slate-950/80 transition flex flex-col items-center justify-center">
                    <Camera className="w-6 h-6 text-slate-500 mb-1" />
                    <span className="text-xs text-slate-400">Subir evidencia fotográfica</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files)
                        setReportImages(prev => [...prev, ...files])
                      }}
                    />
                  </label>

                  {reportImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {reportImages.map((file, i) => (
                        <div key={i} className="relative">
                          <img
                            src={file instanceof File ? URL.createObjectURL(file) : file}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setReportImages(reportImages.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowReportForm(false); setReportImages([]) }}
                      className="flex-1 btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        if (!reportDesc) return
                        setActionLoading(true)
                        try {
                          let imageUrls = []
                          if (reportImages.length > 0) {
                            imageUrls = await uploadImages(reportImages)
                          } else {
                            imageUrls = ['https://via.placeholder.com/400x300?text=Sin+foto']
                          }
                          await handleAction('report', {
                            description: reportDesc,
                            image_urls: imageUrls
                          })
                          setReportImages([])
                          setReportDesc('')
                          setShowReportForm(false)
                        } catch (err) {
                          setError('Error al subir las imágenes: ' + err.message)
                        } finally {
                          setActionLoading(false)
                        }
                      }}
                      disabled={actionLoading || !reportDesc}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center gap-1"
                    >
                      {actionLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                      {actionLoading ? 'Subiendo...' : 'Enviar Reporte'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ✅ NUEVA SECCIÓN DE BOTONES CON DIFERENCIACIÓN POR ORIGEN */}
        <div className="md:left-[calc(50%+8rem)] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900/90 border-t border-slate-800/80 px-4 py-4 space-y-2 z-40 backdrop-blur-md">

          {/* ASIGNADO — antes de aceptar */}
          {ticket.status === 'ASIGNADO' && !techAccepted && (
            <button
              onClick={() => handleAction('start')}
              disabled={actionLoading}
              className="w-full btn-primary"
            >
              {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aceptar e Iniciar Tarea
            </button>
          )}

          {/* ASIGNADO — ticket CIUDADANO esperando cliente */}
          {ticket.status === 'ASIGNADO' && techAccepted && ticket.origin === 'CIUDADANO' && (
            <button
              onClick={() => handleAction('go')}
              disabled={actionLoading || !clientConfirmed}
              className="w-full bg-emerald-650 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 border border-emerald-500/20 active:scale-[0.98] transition"
            >
              {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {clientConfirmed ? 'Yendo a la vivienda 🚗' : 'Esperando confirmación del cliente...'}
            </button>
          )}

          {/* EN_CAMINO — ticket CIUDADANO (antes de llegar) */}
          {ticket.status === 'EN_CAMINO' && ticket.origin === 'CIUDADANO' && !techArrived && (
            <>
              <button
                onClick={() => handleAction('arrived')}
                disabled={actionLoading}
                className="w-full btn-primary"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Estoy Afuera de la Vivienda
              </button>
              <button
                onClick={() => setShowAbsentForm(true)}
                className="w-full btn-secondary text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
              >
                Reportar Visita Fallida / Ausente
              </button>
            </>
          )}

          {/* EN_CAMINO — ticket CIUDADANO después de llegar */}
          {ticket.status === 'EN_CAMINO' && ticket.origin === 'CIUDADANO' && techArrived && (
            <>
              <button
                onClick={() => handleAction('execute')}
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Cliente Abrió la Puerta
              </button>
              <button
                onClick={() => setShowAbsentForm(true)}
                className="w-full btn-secondary text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
              >
                Cliente No Abrió / Ausente
              </button>
            </>
          )}

          {/* EN_CAMINO — ticket INTERNO antes de llegar */}
          {ticket.status === 'EN_CAMINO' && ticket.origin === 'INTERNO' && !techArrived && (
            <button
              onClick={() => handleAction('arrived')}
              disabled={actionLoading}
              className="w-full btn-primary"
            >
              {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Llegué a la Ubicación
            </button>
          )}

          {/* EN_CAMINO — ticket INTERNO después de llegar */}
          {ticket.status === 'EN_CAMINO' && ticket.origin === 'INTERNO' && techArrived && (
            <button
              onClick={() => handleAction('execute')}
              disabled={actionLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition"
            >
              {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Iniciar Trabajo
            </button>
          )}

          {/* EJECUCION_ACTIVA */}
          {ticket.status === 'EJECUCION_ACTIVA' && (
            <div className="space-y-2">
              {!ticket.is_client_conformed && ticket.origin === 'CIUDADANO' && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3">
                  <p className="text-amber-400 text-sm text-center">⏳ Esperando conformidad del cliente...</p>
                </div>
              )}
              <button
                onClick={() => setShowReportForm(true)}
                disabled={!ticket.is_client_conformed && ticket.origin === 'CIUDADANO'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
              >
                <Camera className="w-4 h-4" />
                {!ticket.is_client_conformed && ticket.origin === 'CIUDADANO'
                  ? 'Esperando conformidad del cliente'
                  : 'Subir Evidencia y Finalizar'}
              </button>
            </div>
          )}

          {/* PRE_CERRADO */}
          {ticket.status === 'PRE_CERRADO' && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
              <p className="text-teal-400 font-semibold text-sm">Reporte enviado</p>
              <p className="text-slate-400 text-xs mt-1">Esperando aprobación del administrador</p>
            </div>
          )}

          {/* OBSERVADO */}
          {ticket.status === 'OBSERVADO' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-bounce" />
              <p className="text-amber-400 font-semibold text-sm">Ticket Observado</p>
              <p className="text-slate-400 text-xs mt-1">El administrador revisará este caso</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}