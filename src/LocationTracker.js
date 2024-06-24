import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet's default icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  const watchPosition = useCallback(() => {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
      },
      (error) => {
        console.error(error);
        if (error.code === 3) {
          // Timeout
          setTimeout(watchPosition, 5000); // Retry after 5 seconds
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    if (tracking) {
      watchPosition();
    }
  }, [tracking, watchPosition]);

  useEffect(() => {
    if (currentLocation && tracking) {
      setLocation(currentLocation);
    }
  }, [currentLocation, tracking]);

  const handleStartStop = () => {
    if (tracking) {
      if (window.confirm("Are you sure you want to stop tracking?")) {
        setTracking(false);
        if (currentLocation) {
          setPath((prevPath) => [...prevPath, currentLocation]);
        }
      }
    } else {
      setTracking(true);
      setPath([]);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <button
        onClick={handleStartStop}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {tracking ? "Stop" : "Start"}
      </button>
      {location && (
        <MapContainer center={location} zoom={13} className="h-2/3 w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {path.map((pos, index) => (
            <Marker key={index} position={pos}></Marker>
          ))}
          <Polyline positions={path} color="blue" />
        </MapContainer>
      )}
    </div>
  );
};

export default LocationTracker;
