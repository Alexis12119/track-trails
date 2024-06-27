import React, { useEffect, useState } from "react";
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

const TrailMap = ({ trail, onNewPosition, isTracking }) => {
  const [positions, setPositions] = useState(trail.path);

  useEffect(() => {
    if (isTracking && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setPositions((prevPositions) => {
            const updatedPositions = [...prevPositions, newPos];
            onNewPosition(updatedPositions); // Callback to handle new positions
            return updatedPositions;
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isTracking, onNewPosition]);

  return (
    <MapContainer
      center={[trail.start.latitude, trail.start.longitude]}
      zoom={13}
      className="w-full h-64 mb-4 rounded border"
      style={{ height: "300px" }} // Ensure a square aspect ratio
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {positions.length > 0 && (
        <>
          <Marker
            position={[positions[0].latitude, positions[0].longitude]}
          ></Marker>
          <Polyline
            positions={positions.map((pos) => [pos.latitude, pos.longitude])}
            color="blue"
          />
          <Marker
            position={[
              positions[positions.length - 1].latitude,
              positions[positions.length - 1].longitude,
            ]}
          ></Marker>
        </>
      )}
    </MapContainer>
  );
};

export default TrailMap;
