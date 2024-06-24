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
  const [trails, setTrails] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState(null);

  const fetchTrails = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "trails"));
      const trailsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTrails(trailsData);
      console.log("Fetched trails:", trailsData);
    } catch (error) {
      console.error("Error fetching trails:", error);
    }
  }, []);

  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  useEffect(() => {
    let watchId;

    if (tracking) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
          setPath((prevPath) => [...prevPath, { latitude, longitude }]);
        },
        (error) => {
          console.error(error);
          if (error.code === 3) {
            setTimeout(() => {
              if (tracking) watchId = navigator.geolocation.watchPosition();
            }, 5000);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [tracking]);

  const handleStartStop = async () => {
    if (tracking) {
      if (window.confirm("Are you sure you want to stop tracking?")) {
        setTracking(false);

        if (path.length === 0) {
          alert("No path data to save.");
          return;
        }

        const startLocation = path[0];
        const stopLocation = path[path.length - 1];

        try {
          await addDoc(collection(db, "trails"), {
            name: `Trail ${trails.length + 1}`,
            start: startLocation,
            stop: stopLocation,
            path: path,
            timestamp: new Date(),
          });
          console.log("Trail saved successfully");
          fetchTrails();
        } catch (error) {
          console.error("Error saving trail:", error);
        }
      }
    } else {
      setTracking(true);
      setPath([]);
      // Initialize location to the current position when starting tracking
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
          setPath([{ latitude, longitude }]);
        },
        (error) => {
          console.error(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleTrailSelect = (trail) => {
    setSelectedTrail(trail);
    setLocation([trail.start.latitude, trail.start.longitude]);
  };

  return (
    <div className="h-screen flex">
      <div className="w-1/4 h-full p-4 bg-gray-100">
        <button
          onClick={handleStartStop}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded w-full"
        >
          {tracking ? "Stop" : "Start"}
        </button>
        <h2 className="font-bold mb-4">Previous Trails</h2>
        <ul>
          {trails.map((trail) => (
            <li
              key={trail.id}
              className="cursor-pointer hover:bg-gray-200 p-2 rounded"
              onClick={() => handleTrailSelect(trail)}
            >
              {trail.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-3/4 h-full">
        <MapContainer
          center={location}
          zoom={13}
          className="h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {selectedTrail && (
            <>
              <Marker position={[selectedTrail.start.latitude, selectedTrail.start.longitude]}></Marker>
              <Polyline
                positions={selectedTrail.path.map((pos) => [pos.latitude, pos.longitude])}
                color="blue"
              />
              <Marker position={[selectedTrail.stop.latitude, selectedTrail.stop.longitude]}></Marker>
            </>
          )}
          {tracking && path.length > 0 && (
            <>
              <Marker position={[path[0].latitude, path[0].longitude]}></Marker>
              <Polyline
                positions={path.map((pos) => [pos.latitude, pos.longitude])}
                color="red"
              />
              <Marker position={location}></Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationTracker;
