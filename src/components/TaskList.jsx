import React from "react";
import getIcon from "../utils/getIcon";
import { assigneeColors } from "../utils/assigneeColors";

export default function TaskList({ tasks, onComplete, currentUserId }) {
  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p>Keine Aufgaben für diesen User.</p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // Buckets: verfügbar, gesperrt (Intervall/kein Own), erledigt
  const available = [];
  const locked    = [];
  const doneTasks = [];

  tasks.forEach(task => {
    const assignee         = (task.assignedTo || [])[0];
    const isIntervalLocked = task.availableFrom && task.availableFrom > today;
    const isPersonal       = assignee !== "all";
    const isOwn            = assignee === currentUserId;
    const isLocked         = isIntervalLocked || (isPersonal && !isOwn);

    if (task.doneBy) {
      doneTasks.push(task);
    } else if (isLocked) {
      locked.push(task);
    } else {
      available.push(task);
    }
  });

  const renderTask = (task, status) => {
    const assignee         = (task.assignedTo || [])[0];
    const color            = assigneeColors[assignee] || "transparent";
    const isIntervalLocked = task.availableFrom && task.availableFrom > today;
    const isPersonal       = assignee !== "all";
    const isOwn            = assignee === currentUserId;

    let label;
    if (status === "done") {
      label = task.availableFrom
        ? `Zu erledigen am ${task.availableFrom}`
        : `Heute erledigt`;
    } else if (isIntervalLocked) {
      label = `Zu erledigen am ${task.availableFrom}`;
    } else if (isPersonal && !isOwn) {
      label = `Zu erledigen von ${task.assignedToName || assignee}`;
    } else {
      label = "Heute zu erledigen";
    }

    const isDisabled = status !== "available";

    return (
      <div
        key={`${task.id}-${status}`}
        className={`task${isDisabled ? " disabled" : ""}`}
        style={{
          border: `2px solid ${color}`,
          position: "relative",
          marginBottom: "12px"
        }}
      >
               <div
         className="task-text"
         style={{
           opacity: isDisabled ? 0.5 : 1,
           paddingTop: "1.5rem"      /* Platz für das Label schaffen */
         }}
       >
          <div className="task-title">
            {getIcon(task.name)} {task.name}
          </div>
        </div>
     {/* Label unten mittig */}
                  <div
               className="task-label"
               style={{
                 position: "absolute",
                 bottom: "8px",
                 left: "50%",
                 transform: "translateX(-50%)",
                 fontSize: "0.8rem",
                 fontWeight: "bold",
                 color: "#555",
                 background: "rgba(255,255,255,0.8)",
                 padding: "2px 6px",
                 borderRadius: "4px",
                 pointerEvents: "none"
               }}
             >
               {label}
             </div>
        <button
          className={`done-button ${isDisabled ? "grey" : ""}`}
          onClick={() => onComplete(task)}
          disabled={isDisabled}
        >
          {status === "available" ? `🪙 +${task.points}` : status === "done" ? "🔄" : "🔒"}
        </button>
      </div>
    );
  };

  return (
    <div className="task-list">
      {/* Verfügbare */}
      {available.map(t => renderTask(t, "available"))}
      {/* Gesperrte */}
      {locked   .map(t => renderTask(t, "locked"))}
      {/* Erledigte (ganz unten) */}
      {doneTasks.map(t => renderTask(t, "done"))}
    </div>
  );
}
