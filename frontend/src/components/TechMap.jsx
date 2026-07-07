import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const clientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const techIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const SetView = ({ techPos, clientPos }) => {
  const map = useMap()
  useEffect(() => {
    if (techPos && clientPos) {
      const bounds = L.latLngBounds([techPos, clientPos])
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (clientPos) {
      map.setView(clientPos, 15)
    } else if (techPos) {
      map.setView(techPos, 15)
    }
  }, [techPos, clientPos, map])
  return null
}

export default function TechMap({ clientLat, clientLng, clientAddress }) {
  const [techPos, setTechPos] = useState(null)
  const [geoError, setGeoError] = useState('')
  const defaultCenter = [-9.0745, -78.5936]

  const clientPos = clientLat && clientLng
    ? [parseFloat(clientLat), parseFloat(clientLng)]
    : null

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setTechPos([position.coords.latitude, position.coords.longitude])
      },
      (err) => {
        setGeoError('No se pudo obtener tu ubicación')
        console.error(err)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const center = clientPos || defaultCenter

  return (
    <div className="space-y-2">
      {geoError && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-4 py-3 text-xs font-semibold">
          ⚠️ {geoError} — solo se muestra la ubicación del cliente
        </div>
      )}

      <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-800">
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marcador del cliente */}
          {clientPos && (
            <Marker position={clientPos} icon={clientIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-red-600">📍 Destino</p>
                  <p className="text-gray-600 text-xs mt-1">{clientAddress}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcador del técnico */}
          {techPos && (
            <Marker position={techPos} icon={techIcon}>
              <Popup>
                <p className="font-bold text-blue-600 text-sm">🔧 Tu ubicación actual</p>
              </Popup>
            </Marker>
          )}

          {/* Línea entre técnico y cliente */}
          {techPos && clientPos && (
            <Polyline
              positions={[techPos, clientPos]}
              color="#3b82f6"
              weight={3.5}
              dashArray="8 6"
            />
          )}

          <SetView techPos={techPos} clientPos={clientPos} />
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Destino</span>
        </div>
        {techPos && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tu ubicación</span>
          </div>
        )}
        {!techPos && !geoError && (
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider animate-pulse">Obteniendo tu ubicación...</span>
        )}
      </div>
    </div>
  )
}