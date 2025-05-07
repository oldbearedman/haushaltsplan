// src/components/TaskItem.jsx
import React from "react";
import {
  FaBroom, FaUtensils, FaTshirt, FaToilet, FaHandsWash
} from "react-icons/fa";

const getIcon = name => {
  const lower = name.toLowerCase();
  if (lower.includes("tisch")) return <FaUtensils />;
  if (lower.includes("wäsche")) return <FaTshirt />;
  if (lower.includes("boden")) return <FaBroom />;
  if (lower.includes("toilette") || lower.includes("bad")) return <FaToilet />;
  if (lower.includes("hände")) return <FaHandsWash />;
  return <FaBroom />;
};

export default function TaskItem({ task, onToggleComplete }) {
  const isDone = !!task.doneBy;
  const handleClick = () => {
    console.log("TaskItem Klick:", task);
    // für Single-Tasks toggeln – bei Mehrfach-Tasks evtl. mode "add" oder "remove"
    onToggleComplete(task, "toggle");
  };

  return (
    <div className={`task ${isDone ? "done" : ""}`}>
      <div className="task-text">
        <div className="task-title">
          {getIcon(task.name)} {task.name}
        </div>
        <div className="done-by">
          {isDone ? `Erledigt von ${task.doneBy}` : `Punkte: ${task.points}`}
        </div>
      </div>
      <button
        className={`done-button ${isDone ? "grey" : ""}`}
        onClick={handleClick}
      >
        {isDone ? "✖" : `🪙 +${task.points}`}
      </button>
    </div>
  );
}
