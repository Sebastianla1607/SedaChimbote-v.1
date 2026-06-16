import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Bell,
  Plus,
  Home,
  Ticket,
  Map,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader,
  XCircle,
} from "lucide-react";

const priorityConfig = {
  BAJA: { label: "Baja", color: "bg-green-100 text-green-700" },
  MEDIA: { label: "Media", color: "bg-yellow-100 text-yellow-700" },
  ALTA: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  EXTREMA: { label: "Emergencia", color: "bg-red-100 text-red-700" },
};

const statusConfig = {
  PENDIENTE: {
    label: "Pendiente",
    color: "bg-gray-100 text-gray-600",
    icon: <Clock className="w-3 h-3" />,
  },
  ASIGNADO: {
    label: "Asignado",
    color: "bg-blue-100 text-blue-700",
    icon: <Loader className="w-3 h-3" />,
  },
  EN_CAMINO: {
    label: "En camino",
    color: "bg-indigo-100 text-indigo-700",
    icon: <Loader className="w-3 h-3" />,
  },
  EJECUCION_ACTIVA: {
    label: "En proceso",
    color: "bg-purple-100 text-purple-700",
    icon: <Loader className="w-3 h-3" />,
  },
  PRE_CERRADO: {
    label: "Pre-cerrado",
    color: "bg-teal-100 text-teal-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  OBSERVADO: {
    label: "Observado",
    color: "bg-orange-100 text-orange-700",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  CERRADO: {
    label: "Cerrado",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("activos");
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchNotifications();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/tickets/my-tickets");
      setTickets(data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const activeTickets = tickets.filter((t) => t.status !== "CERRADO");
  const historyTickets = tickets.filter((t) => t.status === "CERRADO");

  const displayed = tab === "activos" ? activeTickets : historyTickets;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <div className="bg-[#1a237e] px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#1a237e] font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">
              SEDACHIMBOTE
            </span>
          </div>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) markAllRead();
            }}
            className="relative text-white"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <h2 className="text-white text-xl font-bold">
          Hola, {user?.first_name} 👋
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-blue-800 text-blue-200 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Suministro: N° {user?.id}
          </span>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">
              {activeTickets.length}
            </p>
            <p className="text-blue-300 text-xs">Activos</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">
              {historyTickets.length}
            </p>
            <p className="text-blue-300 text-xs">Cerrados</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">{unreadCount}</p>
            <p className="text-blue-300 text-xs">Avisos</p>
          </div>
        </div>
      </div>

      {/* Notificaciones dropdown */}
      {showNotifications && (
        <div className="absolute top-24 right-4 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">
              Notificaciones
            </span>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">
                Sin notificaciones
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? "bg-blue-50" : ""}`}
                >
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString("es-PE")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex">
          <button
            onClick={() => setTab("activos")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === "activos" ? "border-[#1a237e] text-[#1a237e]" : "border-transparent text-gray-400"}`}
          >
            Activos{" "}
            {activeTickets.length > 0 && (
              <span className="ml-1 bg-[#1a237e] text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeTickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("historial")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === "historial" ? "border-[#1a237e] text-[#1a237e]" : "border-transparent text-gray-400"}`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-[#1a237e] animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              {tab === "activos"
                ? "No tienes reclamos activos"
                : "Sin historial de reclamos"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {tab === "activos"
                ? "Presiona el botón para reportar uno"
                : "Aquí aparecerán tus reclamos cerrados"}
            </p>
          </div>
        ) : (
          displayed.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => {
                // ✅ Lógica actualizada: redirige si está en estados activos
                // o si es ASIGNADO y el técnico ya aceptó (tech_accepted)
                if (
                  ['EN_CAMINO', 'EJECUCION_ACTIVA', 'PRE_CERRADO', 'CERRADO'].includes(ticket.status) ||
                  (ticket.status === 'ASIGNADO' && ticket.tech_accepted)
                ) {
                  navigate(`/client/ticket/${ticket.id}`);
                } else {
                  setSelectedTicket(ticket);
                }
              }}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-400 font-mono">
                  #{ticket.code}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Hace {ticket.days_elapsed} día
                  {ticket.days_elapsed !== 1 ? "s" : ""}
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2">
                {ticket.description}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {ticket.ai_category && (
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {ticket.ai_category}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${priorityConfig[ticket.priority]?.color}`}
                >
                  {priorityConfig[ticket.priority]?.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusConfig[ticket.status]?.color}`}
                >
                  {statusConfig[ticket.status]?.icon}
                  {statusConfig[ticket.status]?.label}
                </span>
              </div>

              {ticket.assigned_esp?.access_code && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#1a237e] rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">
                    Técnico asignado:{" "}
                    <span className="font-semibold text-gray-700">
                      {ticket.assigned_esp.access_code}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Botón flotante unificado */}
      {tab === "activos" && (
        <button
          onClick={() => {
            if (activeTickets.length > 0) return;
            navigate("/client/new-ticket");
          }}
          disabled={activeTickets.length > 0}
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 text-white font-semibold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition ${
            activeTickets.length > 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#1a237e] hover:bg-[#283593]"
          }`}
        >
          <Plus className="w-5 h-5" />
          {activeTickets.length > 0
            ? "Ya tienes un reclamo activo"
            : "Reportar Nuevo Reclamo"}
        </button>
      )}

      {/* Modal detalle ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Detalle del Reclamo</h3>
              <button onClick={() => setSelectedTicket(null)}>
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  #{selectedTicket.code}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusConfig[selectedTicket.status]?.color}`}
                >
                  {statusConfig[selectedTicket.status]?.icon}
                  {statusConfig[selectedTicket.status]?.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[selectedTicket.priority]?.color}`}
                >
                  {priorityConfig[selectedTicket.priority]?.label}
                </span>
              </div>

              <p className="text-sm text-gray-700">
                {selectedTicket.description}
              </p>

              {selectedTicket.reference_point && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    PUNTO DE REFERENCIA
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedTicket.reference_point}
                  </p>
                </div>
              )}

              {selectedTicket.ai_category && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-semibold mb-1">
                    ANÁLISIS DE IA
                  </p>
                  <p className="text-sm text-gray-700">
                    Categoría:{" "}
                    <span className="font-semibold">
                      {selectedTicket.ai_category}
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    CREADO
                  </p>
                  <p className="text-sm text-gray-700">
                    {new Date(selectedTicket.created_at).toLocaleDateString(
                      "es-PE",
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    VENCE
                  </p>
                  <p className="text-sm text-gray-700">
                    {new Date(selectedTicket.due_date).toLocaleDateString(
                      "es-PE",
                    )}
                  </p>
                </div>
              </div>

              {selectedTicket.assigned_esp?.access_code && (
                <div className="bg-[#1a237e] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-[#1a237e]" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 font-semibold">
                      TÉCNICO ASIGNADO
                    </p>
                    <p className="text-white font-bold text-sm">
                      {selectedTicket.assigned_esp.access_code}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-[#1a237e]">
            <Home className="w-5 h-5" />
            <span className="text-xs font-semibold">Inicio</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Ticket className="w-5 h-5" />
            <span className="text-xs">Tickets</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Map className="w-5 h-5" />
            <span className="text-xs">Mapa</span>
          </button>
          <button
            onClick={() => navigate("/client/profile")}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
}