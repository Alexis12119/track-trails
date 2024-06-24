import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet's default icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState([]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the Earth in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2 - lat1) * Math.PI/180;
    const Δλ = (lon2 - lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const watchPosition = useCallback(() => {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation([latitude, longitude]);
        setPath((prevPath) => {
          if (prevPath.length === 0) {
            return [[latitude, longitude]];
          }
          const [lastLat, lastLon] = prevPath[prevPath.length - 1];
          const distance = calculateDistance(lastLat, lastLon, latitude, longitude);
          if (distance > 10) { // Only add point if moved more than 10 meters
            return [...prevPath, [latitude, longitude]];
          }
          return prevPath;
        });
      },
      (error) => {
        console.error(error);
        if (error.code === 3) { // Timeout
          setTimeout(watchPosition, 5000); // Retry after 5 seconds
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (tracking) {
      watchPosition();
    }
  }, [tracking, watchPosition]);

  const handleStartStop = () => {
    if (tracking) {
      if (window.confirm('Are you sure you want to stop tracking?')) {
        setTracking(false);
      }
    } else {
      setTracking(true);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <button
        onClick={handleStartStop}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {tracking ? 'Stop' : 'Start'}
      </button>
      {location && (
        <MapContainer center={location} zoom={13} className="h-2/3 w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {path.map((pos, index) => (
            <Marker key={index} position={pos}>
            </Marker>
          ))}
          <Polyline positions={path} color="blue" />
        </MapContainer>
      )}
    </div>
  );
};

export default LocationTracker;
