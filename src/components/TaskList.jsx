// src/components/TaskList.jsx
import React from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";

export default function TaskList({ tasks, onComplete, currentUserId }) {
  const users = useUsers();
  const today = new Date().toISOString().slice(0, 10);
  const available = [];
  const locked = [];
  const doneTasks = [];

  // Aufgaben in Gruppen aufteilen
  tasks.forEach(task => {
    const assigneeId = (task.assignedTo || [])[0];
    const isIntervalLocked = task.availableFrom && task.availableFrom > today;
    const isPersonal = assigneeId !== "all";
    const isOwn = assigneeId === currentUserId;
    const isLocked = isIntervalLocked || (isPersonal && !isOwn);
    const enriched = { ...task, assigneeId };
    if (task.doneBy) doneTasks.push(enriched);
    else if (isLocked) locked.push(enriched);
    else available.push(enriched);
  });

  // rendert das Profilbild/en
  const renderAssignee = assigneeId => {
    if (assigneeId === "all") {
      return (
        <div style={{ display: "flex", marginRight: 12 }}>
          {users.map((u, idx) => (
            <img
              key={u.id}
              src={`/profiles/${u.name.toLowerCase()}.jpg`}
              alt={u.name}
              style={{
                width: 45,
                height: 45,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${assigneeColors[u.id] || "transparent"}`,
                marginLeft: idx === 0 ? 0 : -10,
                zIndex: users.length - idx
              }}
            />
          ))}
        </div>
      );
    } else {
      const user = users.find(u => u.id === assigneeId);
      const name = user?.name?.toLowerCase() || assigneeId;
      return (
        <img
          src={`/profiles/${name}.jpg`}
          alt={user?.name || assigneeId}
          style={{
            width: 45,
            height: 45,
            borderRadius: "50%",
            objectFit: "cover",
            border: `2px solid ${assigneeColors[assigneeId] || "transparent"}`,
            marginRight: 12
          }}
        />
      );
    }
  };

  // rendert eine Aufgabe
  const renderTask = (task, status) => {
    const { assigneeId } = task;
    const color = assigneeColors[assigneeId] || "transparent";

    // Label-Bestimmung
    let label;
    if (status === "done") {
      label = task.availableFrom
        ? `Zu erledigen am ${task.availableFrom}`
        : `Heute erledigt`;
    } else if (task.availableFrom && task.availableFrom > today) {
      label = `Zu erledigen am ${task.availableFrom}`;
    } else if (assigneeId !== "all" && assigneeId !== currentUserId) {
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
          marginBottom: "12px",
          padding: "8px 16px",
          lineHeight: 1.2
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
            pointerEvents: "none",
            background: "transparent"
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
          <div className="task-title" style={{ flex: 1 }}>
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
    <div className="task-list" style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
      {available.map(t => renderTask(t, "available"))}
      {locked.map(t => renderTask(t, "locked"))}
      {doneTasks.map(t => renderTask(t, "done"))}
    </div>
  );
}
