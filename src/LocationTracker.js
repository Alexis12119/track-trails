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

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [trails, setTrails] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingTrail, setEditingTrail] = useState(null);
  const [newTrailName, setNewTrailName] = useState("");

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
    setOpenDropdownId((prevDropdownId) => (prevDropdownId === trailId ? null : trailId));
  };

  const handleEditTrail = (trail) => {
    setEditingTrail(trail);
    setNewTrailName(trail.name);
    setOpenDropdownId(null);
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
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="flex-1 relative w-full">
        <div className="relative w-full h-full flex items-center justify-center">
          <MapContainer
            center={location || [51.505, -0.09]}
            zoom={13}
            className="w-full h-full"
            style={{ height: "calc(100% - 4rem)", width: "calc(100% - 4rem)" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapUpdater location={location} />
            
            {selectedTrail && !tracking && (
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
      <div className="p-4 bg-gray-100 w-full">
        <button
          onClick={handleStartStop}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {tracking ? "Stop" : "Start"}
        </button>
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
              {trail.id === editingTrail?.id ? (
                <form onSubmit={handleEditSubmit} className="flex items-center w-full">
                  <input
                    type="text"
                    value={newTrailName}
                    onChange={(e) => setNewTrailName(e.target.value)}
                    className="p-1 border rounded flex-grow"
                  />
                  <button type="submit" className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">
                    Save
                  </button>
                  <button
                    type="button"
                    className="ml-2 px-2 py-1 bg-gray-300 rounded cancel-button"
                    onClick={() => setEditingTrail(null)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
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
                  {openDropdownId === trail.id && (
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
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LocationTracker;
