import React from "react";
import getIcon from "../utils/getIcon";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers"; // neu

export default function TaskList({ tasks, onComplete, currentUserId }) {
  const users = useUsers();
  const today = new Date().toISOString().slice(0, 10);

  // Buckets: verfügbar, gesperrt (Intervall/kein Own), erledigt
  const available = [];
  const locked    = [];
  const doneTasks = [];

  tasks.forEach(task => {
    const assigneeId       = (task.assignedTo || [])[0];
    const assigneeName     = users.find(u => u.id === assigneeId)?.name || assigneeId;
    const isIntervalLocked = task.availableFrom && task.availableFrom > today;
    const isPersonal       = assigneeId !== "all";
    const isOwn            = assigneeId === currentUserId;
    const isLocked         = isIntervalLocked || (isPersonal && !isOwn);

    if (task.doneBy) {
      doneTasks.push({ ...task, assigneeName });
    } else if (isLocked) {
      locked.push({ ...task, assigneeName });
    } else {
      available.push({ ...task, assigneeName });
    }
  });

  const renderTask = (task, status) => {
    const color = assigneeColors[(task.assignedTo || [])[0]] || "transparent";
    let label;
    if (status === "done") {
      label = task.availableFrom
        ? `Zu erledigen am ${task.availableFrom}`
        : `Heute erledigt`;
    } else if (task.availableFrom && task.availableFrom > today) {
      label = `Zu erledigen am ${task.availableFrom}`;
    } else if (task.assignedTo[0] !== "all" && task.assignedTo[0] !== currentUserId) {
      label = `Zu erledigen von ${task.assigneeName}`;
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
        {/* unten mittig */}
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
            pointerEvents: "none"
            // kein Hintergrund
          }}
        >
          {label}
        </div>

        <div
          className="task-text"
          style={{
            opacity: isDisabled ? 0.5 : 1,
            paddingBottom: "1.5rem" // Platz für das Label
          }}
        >
          <div className="task-title">
            {getIcon(task.name)} {task.name}
          </div>
        </div>

        <button
          className={`done-button ${isDisabled ? "grey" : ""}`}
          onClick={() => onComplete(task)}
          disabled={isDisabled}
        >
          {status === "available"
            ? `🪙 +${task.points}`
            : status === "done"
              ? "🔄"
              : "🔒"}
        </button>
      </div>
    );
  };

  return (
    <div className="task-list">
      {available.map(t => renderTask(t, "available"))}
      {locked   .map(t => renderTask(t, "locked"))}
      {doneTasks.map(t => renderTask(t, "done"))}
    </div>
  );
}
