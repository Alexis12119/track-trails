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

  const fetchTrails = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "trails"));
      const trailsData = querySnapshot.docs.map((doc) => doc.data());
      setTrails(trailsData);
      console.log("Fetched trails:", trailsData);
    } catch (error) {
      console.error("Error fetching trails:", error);
    }
  }, []);

  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  const watchPosition = useCallback(() => {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation([latitude, longitude]);
        setPath((prevPath) => {
          if (prevPath.length === 0) {
            return [{ latitude, longitude }];
          }
          return [...prevPath, { latitude, longitude }];
        });
      },
      (error) => {
        console.error(error);
        if (error.code === 3) {
          setTimeout(watchPosition, 5000);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (tracking) {
      setStopped(false);
      watchPosition();
    }
  }, [tracking, watchPosition]);

  const handleStartStop = async () => {
    if (tracking) {
      if (window.confirm("Are you sure you want to stop tracking?")) {
        setTracking(false);
        setStopped(true);

        const startLocation = path[0];
        const stopLocation = path[path.length - 1];

        try {
          await addDoc(collection(db, "trails"), {
            start: startLocation,
            stop: stopLocation,
            path: path,
            timestamp: new Date(),
          });
          console.log("Trail saved successfully");
          fetchTrails(); // Fetch updated trails after saving the new trail
        } catch (error) {
          console.error("Error saving trail:", error);
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
        <div className="w-full h-2/3">
          <MapContainer center={location} zoom={13} className="h-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {path.length > 0 && (
              <>
                <Marker position={[path[0].latitude, path[0].longitude]}></Marker>
                <Polyline
                  positions={path.map((pos) => [pos.latitude, pos.longitude])}
                  color="blue"
                />
                {stopped && (
                  <Marker
                    position={[
                      path[path.length - 1].latitude,
                      path[path.length - 1].longitude,
                    ]}
                  ></Marker>
                )}
              </>
            )}
          </MapContainer>
        </div>
      )}
      <div className="mt-4 w-full h-1/3 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {trails.map((trail, index) => (
          <div key={index} className="p-2 border rounded">
            <h3 className="font-bold">Trail {index + 1}</h3>
            <MapContainer
              center={[trail.start.latitude, trail.start.longitude]}
              zoom={13}
              className="h-48 w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[trail.start.latitude, trail.start.longitude]}></Marker>
              <Polyline
                positions={trail.path.map((pos) => [pos.latitude, pos.longitude])}
                color="blue"
              />
              <Marker position={[trail.stop.latitude, trail.stop.longitude]}></Marker>
            </MapContainer>
            <p>Start: {trail.start.latitude}, {trail.start.longitude}</p>
            <p>Stop: {trail.stop.latitude}, {trail.stop.longitude}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationTracker;
