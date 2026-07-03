import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Loader } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'

const steps = [
  { key: 'ASIGNADO', label: 'Asignado', desc: 'Técnico asignado por el sistema' },
  { key: 'EN_CAMINO', label: 'En Camino', desc: 'Unidad móvil en tránsito' },
  { key: 'EJECUCION_ACTIVA', label: 'En la Puerta', desc: 'Técnico en tu vivienda' },
  { key: 'PRE_CERRADO', label: 'En Reparación', desc: 'Trabajo en proceso' },
  { key: 'CERRADO', label: 'Cerrado', desc: 'Servicio completado' },
]

export default function TicketInProgress() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConformity, setShowConformity] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [conformityComment, setConformityComment] = useState('')
  const [npsScore, setNpsScore] = useState(0)
  const [npsComment, setNpsComment] = useState('')
  const [surveyDone, setSurveyDone] = useState(false)
  const [presenceResponded, setPresenceResponded] = useState(false)

  useEffect(() => {
    fetchTicket()
    const interval = setInterval(fetchTicket, 5000)
    return () => clearInterval(interval)
  }, [id])

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`)
      setTicket(data.ticket)
      if (data.ticket.client_survey) setSurveyDone(true)
      const presenceLog = data.ticket.logs?.find(l =>
        l.action === 'CLIENTE_EN_CASA' || l.action === 'CLIENTE_AUSENTE'
      )
      if (presenceLog) setPresenceResponded(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePresence = async (isHome) => {
    setActionLoading(true)
    try {
      await api.post(`/tickets/${id}/presence`, { is_home: isHome })
      setPresenceResponded(true)
      await fetchTicket()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  // ✅ handleConformity actualizado: envía conformidad + encuesta si hay puntuación
  const handleConformity = async () => {
    setActionLoading(true)
    try {
      await api.post(`/tickets/${id}/conformity`, { comment: conformityComment })

      // Guardar encuesta NPS junto con la conformidad
      if (npsScore > 0) {
        await api.post(`/tickets/${id}/survey`, {
          nps_score: npsScore,
          comment: conformityComment
        })
        setSurveyDone(true)
      }

      setShowConformity(false)
      await fetchTicket()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSurvey = async () => {
    if (npsScore === 0) return
    setActionLoading(true)
    try {
      await api.post(`/tickets/${id}/survey`, { nps_score: npsScore, comment: npsComment })
      setSurveyDone(true)
      setShowSurvey(false)
      await fetchTicket()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const getCurrentStep = () => {
    const statusOrder = ['ASIGNADO', 'EN_CAMINO', 'EJECUCION_ACTIVA', 'PRE_CERRADO', 'CERRADO']
    return statusOrder.indexOf(ticket?.status)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-8 h-8 text-[#1a237e] animate-spin" />
    </div>
  )

  if (!ticket) return null

  // ✅ Verificación: si el ticket está ASIGNADO pero el técnico aún no lo ha aceptado,
  // mostrar pantalla de espera.
  const techAccepted = ticket?.logs?.some(l => 
    l.action === 'ASIGNADO' && l.note?.includes('esperando')
  )

  if (ticket.status === 'ASIGNADO' && !techAccepted) {
    return (
      <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Decorative Orbits */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <Sidebar />
        <div className="flex-1 md:pl-64 flex flex-col w-full z-10">
          <div className="bg-slate-900/40 border-b border-slate-900/60 px-4 pt-10 pb-4 flex items-center gap-3 md:px-8 md:py-6">
            <button onClick={() => navigate('/dashboard')} className="text-white hover:text-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-white font-extrabold text-lg">Estado del Reclamo</h1>
              <p className="text-blue-400 text-xs font-mono font-bold">#{ticket.code}</p>
            </div>
          </div>
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="card w-full max-w-sm text-center">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-lg font-black text-slate-100 mb-2">Reclamo en cola</h2>
              <p className="text-slate-400 text-sm mb-5">Tu reclamo ha sido asignado a un técnico. Pronto comenzará la atención de campo.</p>
              <div className="bg-[#1a237e] rounded-2xl p-4 w-full shadow-inner">
                <p className="text-blue-300 text-[10px] uppercase font-bold tracking-widest mb-1">CÓDIGO DE TICKET</p>
                <p className="text-white font-black font-mono text-sm tracking-wider">{ticket.code}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = getCurrentStep()
  const techArrived = ticket.logs?.some(l => l.action === 'TECNICO_AFUERA')

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
        <div className="flex-1">
          <h1 className="text-white font-extrabold text-lg">Atención en Curso</h1>
          <p className="text-blue-400 text-xs font-mono font-bold">#{ticket.code}</p>
        </div>
        {ticket.priority === 'EXTREMA' && (
          <span className="bg-rose-600 border border-rose-500/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">URGENTE</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 md:px-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Col 1: Acciones y Estados de Atención */}
          <div className="space-y-4">
            {/* PASO 1 — Técnico aceptó, ¿estás en casa? */}
            {ticket.status === 'ASIGNADO' && !presenceResponded && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/25 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👷</span>
                  </div>
                  <p className="text-white font-extrabold text-sm">El técnico ha aceptado tu reclamo</p>
                </div>
                <p className="text-slate-300 text-xs mb-4">Para iniciar el viaje, por favor indícanos si te encuentras en tu domicilio.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePresence(true)}
                    disabled={actionLoading}
                    className="bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition active:scale-[0.98]"
                  >
                    ✅ Estoy en casa
                  </button>
                  <button
                    onClick={() => handlePresence(false)}
                    disabled={actionLoading}
                    className="btn-secondary text-slate-200"
                  >
                    ❌ No estoy
                  </button>
                </div>
              </div>
            )}

            {/* Cliente respondió que está en casa */}
            {ticket.status === 'ASIGNADO' && presenceResponded && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-emerald-400 font-bold text-sm">El especialista se dirige a tu vivienda</p>
                  <p className="text-slate-300 text-xs mt-0.5">Por favor espera en tu domicilio para recibirlo.</p>
                </div>
              </div>
            )}

            {/* Técnico en camino */}
            {ticket.status === 'EN_CAMINO' && !techArrived && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/25 rounded-full flex items-center justify-center text-xl">
                  🚗
                </div>
                <div>
                  <p className="text-blue-400 font-bold text-sm">El técnico está en camino</p>
                  <p className="text-slate-400 text-xs mt-0.5">Por favor permanece atento en casa.</p>
                </div>
              </div>
            )}

            {/* Técnico llegó */}
            {ticket.status === 'EN_CAMINO' && techArrived && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚪</span>
                  <p className="text-white font-extrabold text-sm">El técnico llegó a tu domicilio</p>
                </div>
                <p className="text-slate-300 text-xs">Por favor, facilítele el acceso al suministro para comenzar el trabajo.</p>
              </div>
            )}

            {/* ✅ Conformidad */}
            {(ticket.status === 'EJECUCION_ACTIVA' || ticket.status === 'PRE_CERRADO') && !ticket.is_client_conformed && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <p className="text-emerald-400 font-bold text-sm mb-1">El especialista está ejecutando los trabajos</p>
                <p className="text-slate-300 text-xs mb-3">Una vez que finalicen los trabajos de campo, confirma que estás conforme con el resultado.</p>
                <button
                  onClick={() => setShowConformity(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition active:scale-[0.98]"
                >
                  Dar conformidad al trabajo ✅
                </button>
              </div>
            )}

            {/* Conformidad ya registrada */}
            {ticket.is_client_conformed && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-400 text-sm font-bold">Conformidad registrada exitosamente ✅</p>
              </div>
            )}

            {/* Pre-cerrado */}
            {ticket.status === 'PRE_CERRADO' && ticket.is_client_conformed && (
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-teal-400 font-bold text-sm">Trabajo completado en campo</p>
                  <p className="text-slate-400 text-xs mt-0.5">El administrador revisará el caso técnico para su cierre definitivo.</p>
                </div>
              </div>
            )}

            {/* Cerrado — encuesta */}
            {ticket.status === 'CERRADO' && (
              <div className="card text-center p-6">
                <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-black text-slate-100 mb-1 text-lg">¡Reclamo Cerrado!</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Tu reclamo <span className="font-mono font-bold text-blue-400">{ticket.code}</span> fue cerrado exitosamente.
                </p>
                {!surveyDone ? (
                  <button
                    onClick={() => setShowSurvey(true)}
                    className="btn-primary"
                  >
                    Calificar el servicio ⭐
                  </button>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-emerald-400 text-sm font-bold">¡Muchas gracias por tu calificación! 🙏</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Col 2: SLA y Línea de Tiempo */}
          <div className="space-y-4">
            {/* SLA */}
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="label mb-0">SLA Restante</p>
                <p className="text-sm font-bold text-slate-200">
                  Vence el {new Date(ticket.due_date).toLocaleDateString('es-PE')}
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="card">
              <p className="label mb-5">Estado de la Solicitud</p>
              <div className="relative space-y-6 pl-1">
                {/* Línea de fondo */}
                <div className="absolute left-[13px] top-2 bottom-2 w-[1.5px] bg-slate-800/80" />
                
                {/* Línea de progreso activa */}
                <div 
                  className="absolute left-[13px] top-2 w-[1.5px] bg-blue-500 transition-all duration-500" 
                  style={{ height: `${currentStep >= 0 ? (currentStep / (steps.length - 1)) * 100 : 0}%` }}
                />

                {steps.map((step, i) => {
                  const isCompleted = i < currentStep
                  const isActive = i === currentStep

                  return (
                    <div key={step.key} className="flex items-start gap-4 relative z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isCompleted ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)] border border-blue-500/20' :
                        isActive ? 'bg-slate-950 border border-blue-500 ring-4 ring-blue-500/15' :
                        'bg-slate-950 border border-slate-800'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : isActive ? (
                          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                        ) : (
                          <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold transition-colors duration-300 ${isActive ? 'text-blue-400 font-extrabold uppercase tracking-wide' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                          {step.label}
                        </p>
                        <p className={`text-[11px] mt-0.5 leading-relaxed transition-colors duration-300 ${isActive ? 'text-slate-300' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Modal conformidad con estrellas */}
      {showConformity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowConformity(false)} />
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-[2.5rem] w-full max-w-md p-6 z-10 shadow-2xl relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-700 rounded-full mt-3" />
            <h3 className="font-extrabold text-slate-100 mt-2 mb-1 text-lg">Conformidad del Trabajo</h3>
            <p className="text-slate-400 text-xs mb-5">¿El técnico resolvió correctamente el problema en tu vivienda?</p>

            {/* Estrellas */}
            <p className="label mb-3 text-center">Califica la atención recibida</p>
            <div className="flex justify-center gap-3.5 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setNpsScore(star)}
                  className={`text-4xl transition duration-200 active:scale-95 ${
                    star <= npsScore 
                      ? 'text-yellow-500 scale-110 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]' 
                      : 'text-slate-700 hover:text-slate-500'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-5 px-4">
              <span>Muy insatisfecho</span>
              <span>Muy satisfecho</span>
            </div>

            <textarea
              value={conformityComment}
              onChange={(e) => setConformityComment(e.target.value)}
              placeholder="Escribe tus comentarios u observaciones aquí (opcional)..."
              rows={3}
              className="input-base mb-5 resize-none text-xs"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConformity(false)}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConformity}
                disabled={actionLoading || npsScore === 0}
                className="flex-1 btn-primary"
              >
                {actionLoading ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal encuesta NPS */}
      {showSurvey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowSurvey(false)} />
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-[2.5rem] w-full max-w-md p-6 z-10 shadow-2xl relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-700 rounded-full mt-3" />
            <h3 className="font-extrabold text-slate-100 mt-2 mb-1 text-lg">Calificación Final</h3>
            <p className="text-slate-400 text-xs mb-5">Tu opinión es importante. ¿Qué tan satisfecho estás con el servicio?</p>
            
            <div className="flex justify-center gap-3.5 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setNpsScore(star)}
                  className={`text-4xl transition duration-200 active:scale-95 ${
                    star <= npsScore 
                      ? 'text-yellow-500 scale-110 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]' 
                      : 'text-slate-700 hover:text-slate-500'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-5 px-4">
              <span>Muy insatisfecho</span>
              <span>Muy satisfecho</span>
            </div>
            
            <textarea
              value={npsComment}
              onChange={(e) => setNpsComment(e.target.value)}
              placeholder="¿Tienes alguna sugerencia de mejora? (opcional)"
              rows={2}
              className="input-base mb-5 resize-none text-xs"
            />
            
            <button
              onClick={handleSurvey}
              disabled={actionLoading || npsScore === 0}
              className="w-full btn-primary"
            >
              {actionLoading ? 'Enviando...' : 'Enviar y Finalizar'}
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}