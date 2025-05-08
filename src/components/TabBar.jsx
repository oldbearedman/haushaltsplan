// src/components/TabBar.jsx
import React from "react";
import "./TabBar.css";

export default function TabBar({ view, setView }) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-button${view === "tasks" ? " active" : ""}`}
        onClick={() => setView("tasks")}
      >
        Aufgabenliste
      </button>

      {/* Pokal-Button */}
      <button
        className="tab-button trophy-button"
        onClick={() => setView("rankings")}
        title="Rangliste"
      >
        🏆
      </button>

      <button
        className={`tab-button${view === "done" ? " active" : ""}`}
        onClick={() => setView("done")}
      >
        Erledigt
      </button>
    </div>
  );
}
