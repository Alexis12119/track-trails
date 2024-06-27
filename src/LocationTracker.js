import React, { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, getDoc, doc } from "firebase/firestore";
import PreviousTrails from "./PreviousTrails";

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
  const [view, setView] = useState("current");
  const [loading, setLoading] = useState(true);
  const [groupNumber, setGroupNumber] = useState("");

  const fetchUserGroupNumber = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setGroupNumber(userDoc.data().groupNumber);
        }
      }
    } catch (error) {
      console.error("Error fetching user group number:", error);
    }
  }, []);

  const fetchTrails = useCallback(async () => {
    try {
      if (!groupNumber) return;
      const trailsQuery = collection(db, `trails_${groupNumber}`);
      const querySnapshot = await getDocs(trailsQuery);
      const trailsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      }));
      setTrails(trailsData);
      console.log("Fetched trails:", trailsData);
    } catch (error) {
      console.error("Error fetching trails:", error);
    }
  }, [groupNumber]);

  useEffect(() => {
    fetchUserGroupNumber();
  }, [fetchUserGroupNumber]);

  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation([latitude, longitude]);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
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

        const trailName = window.prompt(
          "Enter a name for your trail:",
          `Trail ${trails.length + 1}`,
        );

        try {
          await addDoc(collection(db, `trails_${groupNumber}`), {
            name: trailName || `Trail ${trails.length + 1}`,
            start: {
              latitude: startLocation.latitude,
              longitude: startLocation.longitude,
            },
            stop: {
              latitude: stopLocation.latitude,
              longitude: stopLocation.longitude,
            },
            path: path.map((pos) => ({
              latitude: pos.latitude,
              longitude: pos.longitude,
            })),
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
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
          setPath([{ latitude, longitude }]);
        },
        (error) => {
          console.error(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    }
  };

  const handleTrailSelect = (trail) => {
    setSelectedTrail(trail);
    setLocation([trail.start.latitude, trail.start.longitude]);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await auth.signOut();
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('currentView', newView);
  };

  useEffect(() => {
    const savedView = localStorage.getItem('currentView');
    if (savedView) {
      setView(savedView);
    }
  }, []);

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
      <div className="p-4 bg-gray-100 flex justify-between">
        <button
          onClick={() => handleViewChange("current")}
          className={`mb-4 px-4 py-2 rounded w-full ${
            view === "current"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Current Trail
        </button>
        <button
          onClick={() => handleViewChange("previous")}
          className={`mb-4 px-4 py-2 rounded w-full ${
            view === "previous"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Previous Trails
        </button>
        <button
          onClick={handleLogout}
          className="mb-4 px-2 py-2 bg-red-500 text-white rounded w-full"
        >
          Logout
        </button>
      </div>
      {view === "current" ? (
        <>
          <div className="flex-1 relative">
            <div className="relative w-full h-full flex items-center justify-center">
              {loading ? (
                <p>Loading current location...</p>
              ) : (
                <MapContainer
                  center={location}
                  zoom={13}
                  className="w-full h-full"
                  style={{
                    height: "calc(100% - 4rem)",
                    width: "calc(100% - 4rem)",
                  }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapUpdater location={location} />

                  {selectedTrail && !tracking && (
                    <>
                      <Marker
                        position={[
                          selectedTrail.start.latitude,
                          selectedTrail.start.longitude,
                        ]}
                      ></Marker>
                      <Polyline
                        positions={selectedTrail.path.map((pos) => [
                          pos.latitude,
                          pos.longitude,
                        ])}
                        color="blue"
                      />
                      <Marker
                        position={[
                          selectedTrail.stop.latitude,
                          selectedTrail.stop.longitude,
                        ]}
                      ></Marker>
                    </>
                  )}

                  {tracking && path.length > 0 && (
                    <>
                      <Marker
                        position={[path[0].latitude, path[0].longitude]}
                      ></Marker>
                      <Polyline
                        positions={path.map((pos) => [
                          pos.latitude,
                          pos.longitude,
                        ])}
                        color="red"
                      />
                      <Marker position={location}></Marker>
                    </>
                  )}

                  {location && <Marker position={location}></Marker>}
                </MapContainer>
              )}
            </div>
          </div>
          <div className="p-4 bg-gray-100 flex justify-center items-center">
            <button
              onClick={handleStartStop}
              className={`mb-4 px-4 py-2 rounded ${
                tracking ? "bg-red-500 text-white" : "bg-green-500 text-white"
              }`}
            >
              {tracking ? "Stop" : "Start"} Tracking
            </button>
          </div>
        </>
      ) : (
        <PreviousTrails
          trails={trails}
          fetchTrails={fetchTrails}
          handleTrailSelect={handleTrailSelect}
          groupNumber={groupNumber}
        />
      )}
    </div>
  );
};

export default LocationTracker;
