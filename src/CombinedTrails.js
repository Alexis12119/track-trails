import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
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

const CombinedTrails = ({ trails }) => {
  const [selectedTrails, setSelectedTrails] = useState([]);
  const [mapCenter, setMapCenter] = useState([0, 0]);

  const handleTrailToggle = (trailId) => {
    setSelectedTrails((prevSelected) =>
      prevSelected.includes(trailId)
        ? prevSelected.filter((id) => id !== trailId)
        : [...prevSelected, trailId]
    );
  };

  useEffect(() => {
    if (selectedTrails.length > 0) {
      const firstSelectedTrail = trails.find(
        (trail) => trail.id === selectedTrails[0]
      );
      if (firstSelectedTrail) {
        setMapCenter([
          firstSelectedTrail.start.latitude,
          firstSelectedTrail.start.longitude,
        ]);
      }
    }
  }, [selectedTrails, trails]);

  const selectedTrailsData = trails.filter((trail) =>
    selectedTrails.includes(trail.id)
  );

  const MapUpdater = ({ center }) => {
    const map = useMap();

    useEffect(() => {
      map.setView(center);
    }, [center, map]);

    return null;
  };

  // Array of colors for the paths
  const colors = ["blue", "red", "green", "purple", "orange", "yellow"];

  return (
    <div className="flex flex-col md:flex-row p-4 h-full">
      <div className="flex-1 mb-4 md:mb-0">
        <MapContainer
          center={mapCenter}
          zoom={13}
          className="w-full h-64 md:h-full rounded border"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapUpdater center={mapCenter} />
          {selectedTrailsData.map((trail, index) => (
            <React.Fragment key={trail.id}>
              <Polyline
                positions={trail.path.map((pos) => [pos.latitude, pos.longitude])}
                color={colors[index % colors.length]}
              />
              <Marker position={[trail.start.latitude, trail.start.longitude]} />
              <Marker position={[trail.stop.latitude, trail.stop.longitude]} />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
      <div className="md:w-1/4 md:ml-4 overflow-y-auto h-64 md:h-full border rounded p-2">
        <h2 className="text-xl font-bold mb-2">Select Trails to Combine</h2>
        <ul>
          {trails.map((trail) => (
            <li key={trail.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`trail-${trail.id}`}
                className="mr-2"
                checked={selectedTrails.includes(trail.id)}
                onChange={() => handleTrailToggle(trail.id)}
              />
              <label htmlFor={`trail-${trail.id}`}>{trail.name}</label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CombinedTrails;
