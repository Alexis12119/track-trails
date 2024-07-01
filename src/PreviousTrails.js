import React, { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import TrailMap from "./TrailMap";

const PreviousTrails = ({
  trails,
  fetchTrails,
  groupNumber,
}) => {
  const [editingTrail, setEditingTrail] = useState(null);
  const [newTrailName, setNewTrailName] = useState("");
  const [sortOrder, setSortOrder] = useState("alphabetical-asc");
  const [searchQuery, setSearchQuery] = useState("");

  const handleEditTrail = (trail) => {
    setEditingTrail(trail);
    setNewTrailName(trail.name);
  };

  const handleDeleteTrail = async (trailId) => {
    if (window.confirm("Are you sure you want to delete this trail?")) {
      try {
        await deleteDoc(doc(db, `trails_${groupNumber}`, trailId));
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
    //
    // const isUnique = trails.every(
    //   (trail) => trail.name !== newTrailName.trim(),
    // );
    // if (!isUnique) {
    //   alert("Trail name must be unique.");
    //   return;
    // }
    //
    try {
      await updateDoc(doc(db, `trails_${groupNumber}`, editingTrail.id), {
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

  const filteredTrails = trails.filter((trail) =>
    trail.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTrails = filteredTrails.sort((a, b) => {
    if (sortOrder === "alphabetical-asc") {
      return a.name.localeCompare(b.name);
    } else if (sortOrder === "alphabetical-desc") {
      return b.name.localeCompare(a.name);
    } else if (sortOrder === "new") {
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else if (sortOrder === "old") {
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
    return 0;
  });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="top-0 bg-gray-100 z-10 mb-4 p-4">
        <input
          type="text"
          className="p-2 mb-4 rounded border w-full"
          placeholder="Search for a trail"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="p-2 rounded border w-full"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="alphabetical-asc">Sort A-Z</option>
          <option value="alphabetical-desc">Sort Z-A</option>
          <option value="new">Sort by Newest</option>
          <option value="old">Sort by Oldest</option>
        </select>
      </div>
      <ul className="flex-1 p-4 bg-gray-100">
        {sortedTrails.map((trail) => (
          <li
            key={trail.id}
            className="relative mb-4 p-2 rounded bg-white shadow-lg"
          >
            <div
              className="cursor-pointer hover:bg-gray-200 p-2 rounded flex justify-between items-center"
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
                  <span>
                    {trail.name}{" "}
                    <small>
                      ({new Date(trail.timestamp).toLocaleString()})
                    </small>
                  </span>
                  <div className="flex">
                    <button
                      className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTrail(trail);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrail(trail.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="p-2">
              <TrailMap trail={trail} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PreviousTrails;
