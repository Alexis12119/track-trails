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
import { collection, addDoc, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import PreviousTrails from "./PreviousTrails";
import CombinedTrails from "./CombinedTrails";

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
          `Trail ${trails.length + 1}`
        );

        try {
          const existingTrail = selectedTrail
            ? await getDoc(doc(db, `trails_${groupNumber}`, selectedTrail.id))
            : null;

          const newPaths = existingTrail
            ? [...existingTrail.data().paths, path.map((pos) => ({
                latitude: pos.latitude,
                longitude: pos.longitude
              }))]
            : [path.map((pos) => ({
                latitude: pos.latitude,
                longitude: pos.longitude
              }))];

          if (existingTrail) {
            await updateDoc(doc(db, `trails_${groupNumber}`, selectedTrail.id), {
              paths: newPaths
            });
            console.log("Trail updated successfully");
          } else {
            await addDoc(collection(db, `trails_${groupNumber}`), {
              name: trailName || `Trail ${trails.length + 1}`,
              start: {
                latitude: startLocation.latitude,
                longitude: startLocation.longitude
              },
              stop: {
                latitude: stopLocation.latitude,
                longitude: stopLocation.longitude
              },
              paths: newPaths,
              timestamp: new Date()
            });
            console.log("Trail saved successfully");
          }

          fetchTrails();
        } catch (error) {
          console.error("Error saving trail:", error);
        }
        setPath([]);
      }
    } else {
      setTracking(true);
    }
  };

  const handleTrailSelect = (trail) => {
    setSelectedTrail(trail);
    setView("current");
  };

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem("currentView", newView);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await auth.signOut();
    }
  };

  useEffect(() => {
    const savedView = localStorage.getItem("currentView");
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
          onClick={() => handleViewChange("combined")}
          className={`mb-4 px-4 py-2 rounded w-full ${
            view === "combined"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Combined Trails
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

                  {selectedTrail && !tracking && selectedTrail.paths.map((path, index) => (
                    <React.Fragment key={index}>
                      <Marker position={[path[0].latitude, path[0].longitude]}></Marker>
                      <Polyline
                        positions={path.map((pos) => [
                          pos.latitude,
                          pos.longitude,
                        ])}
                        color="blue"
                      />
                      <Marker
                        position={[
                          path[path.length - 1].latitude,
                          path[path.length - 1].longitude,
                        ]}
                      ></Marker>
                    </React.Fragment>
                  ))}

                  {path.length > 0 && (
                    <Polyline
                      positions={path.map((pos) => [pos.latitude, pos.longitude])}
                      color="red"
                    />
                  )}
                  {location && <Marker position={location}></Marker>}
                </MapContainer>
              )}
            </div>
          </div>
          <button
            onClick={handleStartStop}
            className={`p-4 text-white ${tracking ? "bg-red-500" : "bg-blue-500"
              }`}
          >
            {tracking ? "Stop" : "Start"}
          </button>
        </>
      ) : view === "previous" ? (
        <PreviousTrails
          trails={trails}
          handleTrailSelect={handleTrailSelect}
        />
      ) : (
        <CombinedTrails trails={trails} />
      )}
    </div>
  );
};

export default LocationTracker;
