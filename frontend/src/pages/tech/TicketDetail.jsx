import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, Camera, X, Loader } from 'lucide-react'

const priorityConfig = {
  BAJA: { label: 'Prioridad Baja', color: 'bg-green-100 text-green-700' },
  MEDIA: { label: 'Prioridad Media', color: 'bg-yellow-100 text-yellow-700' },
  ALTA: { label: 'Prioridad Alta', color: 'bg-orange-100 text-orange-700' },
  EXTREMA: { label: 'Emergencia', color: 'bg-red-100 text-red-700' },
}

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
  const [clientConfirmed, setClientConfirmed] = useState(false)

  useEffect(() => {
    fetchTicket()
    const interval = setInterval(fetchTicket, 10000)
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

  // Determinar si el técnico tiene un trabajo en progreso (WIP)
  const isWip = ticket.status === 'EN_CAMINO' || ticket.status === 'EJECUCION_ACTIVA'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* Header con botón de volver bloqueado en WIP */}
      <div className="bg-[#1a237e] px-4 pt-10 pb-4 flex items-center gap-3">
        <button
          onClick={() => {
            if (isWip) return
            navigate('/tech/dashboard')
          }}
          className={`${isWip ? 'text-blue-400 cursor-not-allowed' : 'text-white'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold">Detalle de Ticket</h1>
          <p className="text-blue-300 text-xs font-mono">{ticket.code}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${priorityConfig[ticket.priority]?.color}`}>
          {priorityConfig[ticket.priority]?.label}
        </span>
      </div>

      {ticket.priority === 'EXTREMA' && (
        <div className="bg-red-500 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
          <p className="text-white text-xs font-bold">TIENES UNA TAREA EN CURSO — ATENCIÓN URGENTE</p>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">

        {/* Descripción */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Descripción del Cliente</p>
          <p className="text-sm text-gray-700 italic">"{ticket.description}"</p>
          {ticket.reference_point && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-semibold mb-1">PUNTO DE REFERENCIA</p>
              <p className="text-sm text-gray-600">{ticket.reference_point}</p>
            </div>
          )}
        </div>

        {/* Análisis IA */}
        {ticket.ai_report && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">IA</span>
              </div>
              <p className="text-xs font-semibold text-blue-700">Análisis de Gemini IA</p>
            </div>
            <p className="text-sm text-blue-800">{ticket.ai_report}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {ticket.ai_category && (
                <div className="bg-white rounded-lg p-2">
                  <p className="text-xs text-gray-500">Categoría</p>
                  <p className="text-sm font-semibold text-gray-800">{ticket.ai_category}</p>
                </div>
              )}
              {ticket.ai_difficulty && (
                <div className="bg-white rounded-lg p-2">
                  <p className="text-xs text-gray-500">Dificultad</p>
                  <p className="text-sm font-semibold text-gray-800">{ticket.ai_difficulty}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ubicación */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ubicación</p>
          <p className="text-sm text-gray-700 mb-3 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#1a237e]" />
            {ticket.address}
          </p>
          <button
            onClick={openMaps}
            className="w-full bg-[#1a237e] text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Abrir en Google Maps
          </button>
        </div>

        {/* SLA */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase">Fecha límite</p>
          </div>
          <p className="text-sm font-semibold text-gray-800">
            {new Date(ticket.due_date).toLocaleDateString('es-PE')}
          </p>
        </div>

        {/* Estado esperando cliente — después de aceptar */}
        {ticket.status === 'ASIGNADO' && ticket.logs?.some(l => l.action === 'ASIGNADO' && l.note?.includes('esperando')) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <p className="text-yellow-700 font-semibold text-sm">Esperando respuesta del cliente</p>
            </div>
            <p className="text-yellow-600 text-xs mb-3">Se notificó al cliente para confirmar si está en casa. Cuando confirme podrás iniciar el viaje.</p>
            <div className="bg-white rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">¿Cliente confirmó?</span>
              <button
                onClick={() => setClientConfirmed(!clientConfirmed)}
                className={`text-xs font-semibold px-3 py-1 rounded-full ${clientConfirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {clientConfirmed ? '✅ Sí confirmó' : 'Pendiente'}
              </button>
            </div>
          </div>
        )}

        {/* Formulario cliente ausente */}
        {showAbsentForm && (
          <div className="bg-white rounded-xl border border-orange-200 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Reportar Cliente Ausente</p>
            <textarea
              value={absentNote}
              onChange={(e) => setAbsentNote(e.target.value)}
              placeholder="Describe la situación..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAbsentForm(false)}
                className="flex-1 border border-gray-300 text-gray-600 text-sm font-semibold py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction('absent', { description: absentNote })}
                disabled={actionLoading}
                className="flex-1 bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}

        {/* Formulario reporte final */}
        {showReportForm && (
          <div className="bg-white rounded-xl border border-green-200 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Reporte Final de Trabajo</p>
            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="Describe el trabajo realizado..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none mb-3"
            />
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-4 cursor-pointer mb-3">
              <Camera className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Subir evidencia fotográfica</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f))
                  setReportImages([...reportImages, ...urls])
                }}
              />
            </label>
            {reportImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {reportImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} className="w-16 h-16 object-cover rounded-lg" />
                    <button
                      onClick={() => setReportImages(reportImages.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowReportForm(false)}
                className="flex-1 border border-gray-300 text-gray-600 text-sm font-semibold py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction('report', {
                  description: reportDesc,
                  image_urls: reportImages.length > 0 ? reportImages : ['https://example.com/evidencia.jpg']
                })}
                disabled={actionLoading || !reportDesc}
                className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Botones según estado */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-4 space-y-2">

        {/* Estado ASIGNADO — antes de aceptar */}
        {ticket.status === 'ASIGNADO' && !ticket.logs?.some(l => l.action === 'ASIGNADO' && l.note?.includes('esperando')) && (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading}
            className="w-full bg-[#1a237e] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Aceptar e Iniciar Tarea
          </button>
        )}

        {/* Estado ASIGNADO — después de aceptar, esperando cliente */}
        {ticket.status === 'ASIGNADO' && ticket.logs?.some(l => l.action === 'ASIGNADO' && l.note?.includes('esperando')) && (
          <button
            onClick={() => handleAction('go')}
            disabled={actionLoading || !clientConfirmed}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {clientConfirmed ? 'Yendo a la vivienda 🚗' : 'Esperando confirmación del cliente...'}
          </button>
        )}

        {/* Estado EN_CAMINO */}
        {ticket.status === 'EN_CAMINO' && (
          <>
            <button
              onClick={() => handleAction('arrived')}
              disabled={actionLoading}
              className="w-full bg-[#1a237e] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Estoy Afuera de la Vivienda
            </button>
            <button
              onClick={() => setShowAbsentForm(true)}
              className="w-full border border-orange-400 text-orange-500 font-semibold py-2.5 rounded-xl text-sm"
            >
              Reportar Visita Fallida / Ausente
            </button>
          </>
        )}

        {/* Estado EN_CAMINO — después de llegar, esperando que abra */}
        {ticket.status === 'EN_CAMINO' && ticket.logs?.some(l => l.action === 'TECNICO_AFUERA') && (
          <button
            onClick={() => handleAction('execute')}
            disabled={actionLoading}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Cliente Abrió la Puerta
          </button>
        )}

        {/* Estado EJECUCION_ACTIVA */}
        {ticket.status === 'EJECUCION_ACTIVA' && (
          <button
            onClick={() => setShowReportForm(true)}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Subir Evidencia y Finalizar
          </button>
        )}

        {/* Estado PRE_CERRADO */}
        {ticket.status === 'PRE_CERRADO' && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <p className="text-teal-700 font-semibold text-sm">Reporte enviado</p>
            <p className="text-teal-600 text-xs mt-1">Esperando aprobación del administrador</p>
          </div>
        )}

        {/* Estado OBSERVADO */}
        {ticket.status === 'OBSERVADO' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-orange-700 font-semibold text-sm">Ticket Observado</p>
            <p className="text-orange-600 text-xs mt-1">El administrador revisará este caso</p>
          </div>
        )}

      </div>
    </div>
  )
}