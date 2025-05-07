import React from "react";

export default function TabBar({ view, setView }) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-button ${view === "tasks" ? "active" : ""}`}
        onClick={() => setView("tasks")}
      >
        Aufgabenliste
      </button>
      <button
        className={`tab-button ${view === "done" ? "active" : ""}`}
        onClick={() => setView("done")}
      >
        Erledigt
      </button>
    </div>
  );
}
