import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "./firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

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

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [trails, setTrails] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [dropdowns, setDropdowns] = useState({});
  const [editingTrail, setEditingTrail] = useState(null);
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
  };

  const handleDropdownToggle = (trailId) => {
    setDropdowns((prevDropdowns) => ({
      ...prevDropdowns,
      [trailId]: !prevDropdowns[trailId],
    }));
  };

  const handleEditTrail = (trail) => {
    setEditingTrail(trail);
    setNewTrailName(trail.name);
    setIsModalOpen(true);
    setDropdowns({});
  };

  const handleDeleteTrail = async (trailId) => {
    if (window.confirm("Are you sure you want to delete this trail?")) {
      try {
        await deleteDoc(doc(db, "trails", trailId));
        console.log("Trail deleted successfully");
        fetchTrails();
      } catch (error) {
        console.error("Error deleting trail:", error);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!newTrailName.trim()) {
      alert("Trail name cannot be empty.");
      return;
    }

    const isUnique = trails.every((trail) => trail.name !== newTrailName.trim());
    if (!isUnique) {
      alert("Trail name must be unique.");
      return;
    }

    try {
      await updateDoc(doc(db, "trails", editingTrail.id), {
        name: newTrailName.trim(),
      });
      console.log("Trail updated successfully");
      setEditingTrail(null);
      setNewTrailName("");
      setIsModalOpen(false);
      fetchTrails();
    } catch (error) {
      console.error("Error updating trail:", error);
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

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-gray-100">
        <button
          onClick={handleStartStop}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded w-full"
        >
          {tracking ? "Stop" : "Start"}
        </button>
      </div>
      <div className="flex-1 relative">
        <MapContainer
          center={location || [51.505, -0.09]}
          zoom={13}
          className="absolute inset-0"
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
      <div className="w-full h-1/4 p-4 bg-gray-100 overflow-auto">
        <h2 className="font-bold mb-4">Previous Trails</h2>
        <ul>
          {trails.map((trail) => (
            <li
              key={trail.id}
              className="relative cursor-pointer hover:bg-gray-200 p-2 rounded flex justify-between items-center"
              onClick={() => handleTrailSelect(trail)}
            >
              <span>{trail.name}</span>
              <button
                className="ml-2 px-2 py-1 bg-gray-300 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownToggle(trail.id);
                }}
              >
                ⋮
              </button>
              {dropdowns[trail.id] && (
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-10">
                  <button
                    className="block w-full px-4 py-2 text-left hover:bg-gray-200"
                    onClick={() => handleEditTrail(trail)}
                  >
                    Edit
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-left hover:bg-gray-200"
                    onClick={() => handleDeleteTrail(trail.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleEditSubmit} className="flex flex-col space-y-2">
          <label className="font-bold">Edit Trail Name</label>
          <input
            type="text"
            value={newTrailName}
            onChange={(e) => setNewTrailName(e.target.value)}
            className="p-2 border rounded"
          />
          <div className="flex space-x-2">
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              Save
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LocationTracker;
