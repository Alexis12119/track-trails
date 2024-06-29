import React from "react";
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

const TrailMap = ({ trail }) => {
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
      {trail.paths.map((path, index) => (
        <React.Fragment key={index}>
          <Marker position={[path[0].latitude, path[0].longitude]}></Marker>
          <Polyline
            positions={path.map((pos) => [pos.latitude, pos.longitude])}
            color="blue"
          />
          <Marker
            position={[path[path.length - 1].latitude, path[path.length - 1].longitude]}
          ></Marker>
        </React.Fragment>
      ))}
    </MapContainer>
  );
};

export default TrailMap;
