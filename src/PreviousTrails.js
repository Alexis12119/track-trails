import React from "react";
import TrailMap from "./TrailMap";

const PreviousTrails = ({ trails, handleTrailSelect }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Previous Trails</h2>
      {trails.map((trail) => (
        <div key={trail.id} className="mb-4">
          <h3 className="font-semibold">{trail.name}</h3>
          <TrailMap trail={trail} />
          <button
            onClick={() => handleTrailSelect(trail)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            View Trail
          </button>
        </div>
      ))}
    </div>
  );
};

export default PreviousTrails;
