// src/components/TaskList.jsx
import React from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";

export default function TaskList({ tasks, onComplete, currentUserId }) {
  const users     = useUsers();
  const today     = new Date().toISOString().slice(0, 10);
  const available = [];
  const locked    = [];
  const doneTasks = [];

  // Buckets füllen
  tasks.forEach(task => {
    const assigneeId       = (task.assignedTo || [])[0];
    const isIntervalLocked = task.availableFrom && task.availableFrom > today;
    const isPersonal       = assigneeId !== "all";
    const isOwn            = assigneeId === currentUserId;
    const isLocked         = isIntervalLocked || (isPersonal && !isOwn);

    const enriched = { ...task, assigneeId };
    if (task.doneBy)        doneTasks.push(enriched);
    else if (isLocked)      locked.push(enriched);
    else                    available.push(enriched);
  });

  const renderAssignee = (assigneeId) => {
    if (assigneeId === "all") {
      // alle Nutzer leicht überlappend anzeigen
      return (
        <div style={{ display: "flex", marginRight: 8 }}>
          {users.map((u, idx) => (
            <img
              key={u.id}
              src={`/profiles/${u.name.toLowerCase()}.jpg`}
              alt={u.name}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${assigneeColors[u.id] || "transparent"}`,
                marginLeft: idx === 0 ? 0 : -8,
                zIndex: users.length - idx
              }}
            />
          ))}
        </div>
      );
    } else {
      // Einzelner Nutzer
      const user = users.find(u => u.id === assigneeId);
      const name = user?.name?.toLowerCase() || assigneeId;
      return (
        <img
          src={`/profiles/${name}.jpg`}
          alt={user?.name || assigneeId}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            objectFit: "cover",
            border: `2px solid ${assigneeColors[assigneeId] || "transparent"}`,
            marginRight: 8
          }}
        />
      );
    }
  };

  const renderTask = (task, status) => {
    const { assigneeId } = task;
    const color    = assigneeColors[assigneeId] || "transparent";
    let label;
    if (status === "done") {
      label = task.availableFrom
        ? `Zu erledigen am ${task.availableFrom}`
        : `Heute erledigt`;
    } else if (task.availableFrom && task.availableFrom > today) {
      label = `Zu erledigen am ${task.availableFrom}`;
    } else if (assigneeId !== "all" && assigneeId !== currentUserId) {
      // Nur personalisierte, nicht-eigene Aufgaben
      const user = users.find(u => u.id === assigneeId);
      label = `Zu erledigen von ${user?.name || ""}`;
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
            pointerEvents: "none"
          }}
        >
          {label}
        </div>

        <div
          className="task-text"
          style={{
            opacity: isDisabled ? 0.5 : 1,
            paddingBottom: "1.5rem",
            display: "flex",
            alignItems: "center"
          }}
        >
          {renderAssignee(assigneeId)}
          <div className="task-title">
            {task.name}
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
