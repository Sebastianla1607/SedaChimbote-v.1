import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix icono default de leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Icono del técnico (azul)
const techIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Icono del cliente (rojo)
const clientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Componente para centrar el mapa
const SetView = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 15)
  }, [center])
  return null
}

export default function TechMap({ clientLat, clientLng, clientAddress, techLat, techLng }) {
  const defaultCenter = [-9.0745, -78.5936] // Chimbote centro

  const clientPos = clientLat && clientLng ? [parseFloat(clientLat), parseFloat(clientLng)] : null
  const techPos = techLat && techLng ? [parseFloat(techLat), parseFloat(techLng)] : null
  const center = clientPos || defaultCenter

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
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
                <p className="font-bold text-red-600">📍 Ubicación del cliente</p>
                <p className="text-gray-600 text-xs mt-1">{clientAddress}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador del técnico */}
        {techPos && (
          <Marker position={techPos} icon={techIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-blue-600">🔧 Tu ubicación</p>
              </div>
            </Popup>
          </Marker>
        )}

        {clientPos && <SetView center={clientPos} />}
      </MapContainer>
    </div>
  )
}