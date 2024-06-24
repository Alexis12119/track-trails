import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "./firebase"; 
import { collection, addDoc, getDocs } from "firebase/firestore";

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
  const [stopped, setStopped] = useState(false);
  const [trails, setTrails] = useState([]);

  const watchPosition = useCallback(() => {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation([latitude, longitude]);
        setPath((prevPath) => {
          if (prevPath.length === 0) {
            return [[latitude, longitude]];
          }
          return [...prevPath, [latitude, longitude]];
        });
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
      setStopped(false);
      watchPosition();
    }
  }, [tracking, watchPosition]);

  useEffect(() => {
    const fetchTrails = async () => {
      const querySnapshot = await getDocs(collection(db, "trails"));
      const trailsData = querySnapshot.docs.map((doc) => doc.data());
      setTrails(trailsData);
    };

    fetchTrails();
  }, []);

  const handleStartStop = async () => {
    if (tracking) {
      if (window.confirm("Are you sure you want to stop tracking?")) {
        setTracking(false);
        setStopped(true);

        // Save trail to Firestore
        const startLocation = path[0];
        const stopLocation = path[path.length - 1];
        await addDoc(collection(db, "trails"), {
          start: startLocation,
          stop: stopLocation,
          path: path,
          timestamp: new Date()
        });
      }
    } else {
      setTracking(true);
      setPath([]); // Clear the path when starting a new tracking session
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
          {path.length > 0 && (
            <>
              <Marker position={path[0]}></Marker> {/* Start Marker */}
              <Polyline positions={path} color="blue" />
              {stopped && <Marker position={path[path.length - 1]}></Marker>} {/* End Marker only if stopped */}
            </>
          )}
        </MapContainer>
      )}
      <div className="mt-4 w-full h-1/3 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {trails.map((trail, index) => (
          <div key={index} className="p-2 border rounded">
            <h3 className="font-bold">Trail {index + 1}</h3>
            <MapContainer
              center={trail.start}
              zoom={13}
              className="h-48 w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={trail.start}></Marker>
              <Polyline positions={trail.path} color="blue" />
              <Marker position={trail.stop}></Marker>
            </MapContainer>
            <p>Start: {trail.start.join(", ")}</p>
            <p>Stop: {trail.stop.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationTracker;
