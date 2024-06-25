import React, { useState } from 'react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import TrailMap from './TrailMap';

const PreviousTrails = ({ trails, fetchTrails, handleTrailSelect }) => {
  const [editingTrail, setEditingTrail] = useState(null);
  const [newTrailName, setNewTrailName] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);

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

    const isUnique = trails.every(
      (trail) => trail.name !== newTrailName.trim(),
    );
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

  const handleDropdownToggle = (trailId) => {
    setOpenDropdownId((prevDropdownId) =>
      prevDropdownId === trailId ? null : trailId,
    );
  };

  return (
    <div className="w-full h-full p-4 bg-gray-100 overflow-auto">
      <h2 className="font-bold mb-4">Previous Trails</h2>
      <ul>
        {trails.map((trail) => (
          <li
            key={trail.id}
            className="relative mb-4"
          >
            <div
              className="cursor-pointer hover:bg-gray-200 p-2 rounded flex justify-between items-center"
              onClick={() => handleTrailSelect(trail)}
            >
              {trail.id === editingTrail?.id ? (
                <form
                  onSubmit={handleEditSubmit}
                  className="flex items-center w-full"
                >
                  <input
                    type="text"
                    value={newTrailName}
                    onChange={(e) => setNewTrailName(e.target.value)}
                    className="p-1 border rounded flex-grow"
                  />
                  <button
                    type="submit"
                    className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
                  >
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
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-50">
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
            </div>
            <TrailMap trail={trail} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PreviousTrails;
