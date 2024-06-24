import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "./firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";

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
  const [newTrailName, setNewTrailName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setNewTrailName(trail.name);
  };

  const handleDeleteTrail = async (trailId) => {
    if (window.confirm("Are you sure you want to delete this trail?")) {
      try {
        await deleteDoc(doc(db, "trails", trailId));
        console.log("Trail deleted successfully");
        fetchTrails();
        setSelectedTrail(null);
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting trail:", error);
      }
    }
  };

  const handleEditTrail = async () => {
    if (selectedTrail && newTrailName.trim() !== "") {
      try {
        await updateDoc(doc(db, "trails", selectedTrail.id), {
          name: newTrailName,
        });
        console.log("Trail updated successfully");
        fetchTrails();
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error updating trail:", error);
      }
    } else {
      alert("Trail name cannot be empty");
    }
  };

  const MapUpdater = ({ location }) => {
    const map = useMap();

    useEffect(() => {
      if (location) {
        map.setView(location);
      }
    }, [location, map]);

    return null;
  };

  const handleLongPress = (trail) => {
    setSelectedTrail(trail);
    setNewTrailName(trail.name);
    setIsModalOpen(true);
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
              onMouseDown={() => {
                this.timeout = setTimeout(() => handleLongPress(trail), 1000);
              }}
              onMouseUp={() => clearTimeout(this.timeout)}
              onMouseLeave={() => clearTimeout(this.timeout)}
            >
              {trail.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-3/4 h-full">
        <MapContainer
          center={location || [51.505, -0.09]}
          zoom={13}
          className="h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapUpdater location={location} />
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

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed z-10 inset-0 overflow-y-auto"
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Trail</h3>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={newTrailName}
                      onChange={(e) => setNewTrailName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleEditTrail}
              >
                Save
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => handleDeleteTrail(selectedTrail.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LocationTracker;
