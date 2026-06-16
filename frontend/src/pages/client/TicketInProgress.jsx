import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Loader } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
        <div className="bg-[#1a237e] px-4 pt-10 pb-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold">Estado del Reclamo</h1>
            <p className="text-blue-300 text-xs font-mono">{ticket.code}</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-[#1a237e]" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Reclamo en cola</h2>
          <p className="text-gray-500 text-sm mb-4">Tu reclamo ha sido asignado a un técnico. Pronto comenzará la atención.</p>
          <div className="bg-[#1a237e] rounded-xl p-4 w-full">
            <p className="text-blue-300 text-xs font-semibold mb-1">CÓDIGO</p>
            <p className="text-white font-bold font-mono">{ticket.code}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = getCurrentStep()
  const techArrived = ticket.logs?.some(l => l.action === 'TECNICO_AFUERA')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* Header */}
      <div className="bg-[#1a237e] px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold">Atención en Curso</h1>
          <p className="text-blue-300 text-xs font-mono">{ticket.code}</p>
        </div>
        {ticket.priority === 'EXTREMA' && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">URGENTE</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 space-y-4">

        {/* SLA */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#1a237e]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">SLA Restante</p>
            <p className="text-sm font-bold text-gray-800">
              Vence el {new Date(ticket.due_date).toLocaleDateString('es-PE')}
            </p>
          </div>
        </div>

        {/* PASO 1 — Técnico aceptó, ¿estás en casa? */}
        {ticket.status === 'ASIGNADO' && !presenceResponded && (
          <div className="bg-[#1a237e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👷</span>
              </div>
              <p className="text-white font-semibold text-sm">El técnico ha aceptado tu reclamo</p>
            </div>
            <p className="text-blue-300 text-xs mb-4">Para coordinar la visita, indícanos si estás en casa.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePresence(true)}
                disabled={actionLoading}
                className="bg-white text-[#1a237e] font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
              >
                ✅ Estoy en casa
              </button>
              <button
                onClick={() => handlePresence(false)}
                disabled={actionLoading}
                className="bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
              >
                ❌ No estoy
              </button>
            </div>
          </div>
        )}

        {/* Cliente respondió que está en casa */}
        {ticket.status === 'ASIGNADO' && presenceResponded && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-700 font-semibold text-sm">¡Perfecto! El técnico se dirigirá a tu vivienda</p>
              <p className="text-green-600 text-xs mt-0.5">Espera al técnico en tu domicilio</p>
            </div>
          </div>
        )}

        {/* Técnico en camino */}
        {ticket.status === 'EN_CAMINO' && !techArrived && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
              🚗
            </div>
            <div>
              <p className="text-indigo-700 font-semibold text-sm">El técnico está en camino</p>
              <p className="text-indigo-600 text-xs mt-0.5">Por favor permanece en casa</p>
            </div>
          </div>
        )}

        {/* Técnico llegó */}
        {ticket.status === 'EN_CAMINO' && techArrived && (
          <div className="bg-[#1a237e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚪</span>
              <p className="text-white font-semibold text-sm">El especialista está afuera de tu domicilio</p>
            </div>
            <p className="text-blue-300 text-xs">Por favor, facilite el acceso para que pueda iniciar la inspección.</p>
          </div>
        )}

        {/* ✅ Conformidad: ahora también visible en PRE_CERRADO mientras no se haya confirmado */}
        {(ticket.status === 'EJECUCION_ACTIVA' || ticket.status === 'PRE_CERRADO') && !ticket.is_client_conformed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-semibold text-sm mb-1">El técnico está trabajando en tu problema</p>
            <p className="text-green-600 text-xs mb-3">Cuando el técnico termine, confirma que el trabajo quedó correcto.</p>
            <button
              onClick={() => setShowConformity(true)}
              className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg text-sm"
            >
              Dar conformidad al trabajo ✅
            </button>
          </div>
        )}

        {/* Conformidad ya registrada */}
        {ticket.is_client_conformed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 text-sm font-semibold">Conformidad registrada ✅</p>
          </div>
        )}

        {/* Pre-cerrado (solo informativo si no se ha mostrado el bloque anterior) */}
        {ticket.status === 'PRE_CERRADO' && ticket.is_client_conformed && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-teal-600" />
            <div>
              <p className="text-teal-700 font-semibold text-sm">Trabajo completado</p>
              <p className="text-teal-600 text-xs mt-0.5">El administrador revisará y cerrará el ticket</p>
            </div>
          </div>
        )}

        {/* Cerrado — encuesta (solo si no se envió en conformidad) */}
        {ticket.status === 'CERRADO' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">¡Reclamo Cerrado!</h3>
            <p className="text-gray-500 text-sm mb-4">
              Tu reclamo <span className="font-mono font-bold text-[#1a237e]">{ticket.code}</span> fue cerrado exitosamente.
            </p>
            {!surveyDone ? (
              <button
                onClick={() => setShowSurvey(true)}
                className="w-full bg-[#1a237e] text-white font-semibold py-3 rounded-xl text-sm"
              >
                Calificar el servicio ⭐
              </button>
            ) : (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-green-600 text-sm font-semibold">¡Gracias por tu calificación! 🙏</p>
              </div>
            )}
          </div>
        )}

        {/* Stepper */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Estado de la Solicitud</p>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i < currentStep ? 'bg-[#1a237e]' :
                  i === currentStep ? 'bg-[#1a237e] ring-4 ring-blue-100' :
                  'bg-gray-100'
                }`}>
                  {i < currentStep ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : i === currentStep ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                <div className="flex-1 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <p className={`text-sm font-semibold ${i <= currentStep ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs ${i <= currentStep ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ✅ Modal conformidad con estrellas */}
      {showConformity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full p-6">
            <h3 className="font-bold text-gray-800 mb-2">Conformidad del Trabajo</h3>
            <p className="text-gray-500 text-sm mb-4">¿El técnico resolvió correctamente el problema?</p>

            {/* Estrellas */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Calificación</p>
            <div className="flex justify-center gap-3 mb-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setNpsScore(star)}
                  className={`text-3xl transition ${star <= npsScore ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-4 px-1">
              <span>1 - Muy insatisfecho</span>
              <span>5 - Muy satisfecho</span>
            </div>

            <textarea
              value={conformityComment}
              onChange={(e) => setConformityComment(e.target.value)}
              placeholder="Comentarios adicionales (opcional)..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowConformity(false)}
                className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConformity}
                disabled={actionLoading || npsScore === 0}
                className="flex-1 bg-[#1a237e] text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                {actionLoading ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal encuesta NPS (se mantiene como respaldo si no se envió en conformidad) */}
      {showSurvey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full p-6">
            <h3 className="font-bold text-gray-800 mb-1">Calificación Final</h3>
            <p className="text-gray-500 text-sm mb-4">¿Qué tan satisfecho estás con la resolución de tu caso?</p>
            <div className="flex justify-center gap-3 mb-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setNpsScore(star)}
                  className={`text-3xl transition ${star <= npsScore ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-4 px-1">
              <span>1 - Muy insatisfecho</span>
              <span>5 - Muy satisfecho</span>
            </div>
            <textarea
              value={npsComment}
              onChange={(e) => setNpsComment(e.target.value)}
              placeholder="Comentarios adicionales (Opcional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] resize-none mb-4"
            />
            <button
              onClick={handleSurvey}
              disabled={actionLoading || npsScore === 0}
              className="w-full bg-[#1a237e] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {actionLoading ? 'Enviando...' : 'Enviar y Finalizar'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}