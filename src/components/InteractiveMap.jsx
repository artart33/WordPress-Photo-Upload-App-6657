import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import SafeIcon from '../common/SafeIcon'
import { FiMapPin, FiMove, FiCheck, FiX } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to handle map events
const LocationMarker = ({ position, onPositionChange, isEditing, locationName }) => {
  const [markerPosition, setMarkerPosition] = useState(position)

  useEffect(() => {
    setMarkerPosition(position)
  }, [position])

  const map = useMapEvents({
    click(e) {
      if (isEditing) {
        const newPosition = [e.latlng.lat, e.latlng.lng]
        setMarkerPosition(newPosition)
        onPositionChange(newPosition)
      }
    }
  })

  const markerRef = useRef(null)

  const eventHandlers = {
    dragend() {
      if (isEditing) {
        const marker = markerRef.current
        if (marker != null) {
          const newPosition = [marker.getLatLng().lat, marker.getLatLng().lng]
          setMarkerPosition(newPosition)
          onPositionChange(newPosition)
        }
      }
    }
  }

  return markerPosition ? (
    <Marker 
      position={markerPosition} 
      icon={customIcon}
      ref={markerRef}
      draggable={isEditing}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-semibold text-gray-800 mb-1">
            {locationName || 'Geselecteerde locatie'}
          </div>
          <div className="text-gray-600 text-xs">
            📍 {markerPosition[0].toFixed(6)}°, {markerPosition[1].toFixed(6)}°
          </div>
          {isEditing && (
            <div className="text-blue-600 text-xs mt-1">
              Sleep de pin om de locatie aan te passen
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  ) : null
}

const InteractiveMap = ({ location, onLocationChange, className = "" }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempPosition, setTempPosition] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!location) return null

  const position = [location.latitude, location.longitude]

  const handlePositionChange = (newPosition) => {
    setTempPosition(newPosition)
  }

  const handleSaveLocation = async () => {
    if (!tempPosition) return

    setIsLoading(true)
    try {
      // Reverse geocode the new position
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempPosition[0]}&lon=${tempPosition[1]}&zoom=14&addressdetails=1&accept-language=nl,en`,
        {
          headers: {
            'User-Agent': 'WordPress-Photo-Uploader/1.0'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        let locationName = 'Aangepaste locatie'

        if (data && data.address) {
          const address = data.address
          const locationParts = []

          if (address.road || address.pedestrian) {
            locationParts.push(address.road || address.pedestrian)
          }
          if (address.neighbourhood || address.suburb) {
            locationParts.push(address.neighbourhood || address.suburb)
          }
          if (address.city || address.town || address.village) {
            locationParts.push(address.city || address.town || address.village)
          }

          locationName = locationParts.length > 0 
            ? locationParts.slice(0, 2).join(', ') 
            : data.display_name?.split(',').slice(0, 2).join(', ') || 'Aangepaste locatie'
        }

        const updatedLocation = {
          ...location,
          latitude: tempPosition[0],
          longitude: tempPosition[1],
          locationName: locationName.trim(),
          address: data?.display_name || null,
          mapUrl: `https://maps.google.com/?q=${tempPosition[0]},${tempPosition[1]}`,
          source: 'user-adjusted'
        }

        onLocationChange(updatedLocation)
      }
    } catch (error) {
      console.error('Failed to reverse geocode new position:', error)
      // Fallback: just update coordinates
      const updatedLocation = {
        ...location,
        latitude: tempPosition[0],
        longitude: tempPosition[1],
        locationName: 'Aangepaste locatie',
        mapUrl: `https://maps.google.com/?q=${tempPosition[0]},${tempPosition[1]}`,
        source: 'user-adjusted'
      }
      onLocationChange(updatedLocation)
    } finally {
      setIsLoading(false)
      setIsEditing(false)
      setTempPosition(null)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setTempPosition(null)
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setTempPosition(position)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Map Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiMapPin} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">
                {location.locationName || 'Locatie'}
              </h3>
              <p className="text-xs text-gray-600">
                {position[0].toFixed(6)}°, {position[1].toFixed(6)}°
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <motion.button
                onClick={handleStartEdit}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SafeIcon icon={FiMove} className="text-xs" />
                <span>Aanpassen</span>
              </motion.button>
            ) : (
              <div className="flex items-center space-x-1">
                <motion.button
                  onClick={handleSaveLocation}
                  disabled={isLoading || !tempPosition}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  <SafeIcon icon={FiCheck} className="text-xs" />
                  <span>{isLoading ? 'Opslaan...' : 'Opslaan'}</span>
                </motion.button>
                
                <motion.button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  <SafeIcon icon={FiX} className="text-xs" />
                  <span>Annuleren</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
        
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700"
          >
            💡 <strong>Tip:</strong> Klik op de kaart of sleep de pin om de locatie aan te passen
          </motion.div>
        )}
      </div>

      {/* Map Container */}
      <div className="h-64 relative">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            onPositionChange={handlePositionChange}
            isEditing={isEditing}
            locationName={location.locationName}
          />
        </MapContainer>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Locatie opslaan...</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Zoom: 15x • OpenStreetMap</span>
          <motion.a
            href={location.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium"
            whileHover={{ scale: 1.05 }}
          >
            Bekijk in Google Maps →
          </motion.a>
        </div>
      </div>
    </motion.div>
  )
}

export default InteractiveMap