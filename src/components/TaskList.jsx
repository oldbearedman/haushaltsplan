// src/components/TaskList.jsx
import React from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";
import "./TaskList.css";

export default function TaskList({ tasks, onComplete, currentUserId }) {
  const users = useUsers();
  const today = new Date().toISOString().slice(0, 10);
  const available = [], locked = [], doneTasks = [];

  // Aufgaben nach Status sortieren
  tasks.forEach(task => {
    const assigneeId = (task.assignedTo || [])[0];
    const isLocked =
      (task.availableFrom && task.availableFrom > today) ||
      (assigneeId !== "all" && assigneeId !== currentUserId);
    const enriched = { ...task, assigneeId };
    if (task.doneBy) doneTasks.push(enriched);
    else if (isLocked) locked.push(enriched);
    else available.push(enriched);
  });

  const renderAssignee = assigneeId => {
    if (assigneeId === "all") {
      return (
        <div className="assignees-stack">
          {users.map((u, idx) => (
            <img
              key={u.id}
              src={`/profiles/${u.name.toLowerCase()}.jpg`}
              alt={u.name}
              className="assignee-avatar small"
              style={{ borderColor: assigneeColors[u.id] || "transparent", zIndex: users.length - idx }}
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
          className="assignee-avatar small"
          style={{ borderColor: assigneeColors[assigneeId] || "transparent" }}
        />
      );
    }
  };

  const renderTask = (task, status) => {
    const { assigneeId } = task;
    const color = assigneeColors[assigneeId] || "transparent";

    let label;
    if (status === "done") label = task.availableFrom ? `Zu erledigen am ${task.availableFrom}` : "Heute erledigt";
    else if (task.availableFrom && task.availableFrom > today) label = `Zu erledigen am ${task.availableFrom}`;
    else if (assigneeId !== "all" && assigneeId !== currentUserId)
      label = `Zu erledigen von ${users.find(u => u.id === assigneeId)?.name || ""}`;
    else label = "Heute zu erledigen";

    const isDisabled = status !== "available";

    const icon = status === "available"
      ? `🪙 +${task.points}`
      : status === "done"
      ? "🔄"
      : <span style={{ color: "#222" }}>🔒</span>;

    return (
      <div
        key={`${task.id}-${status}`}
        className={`task-card${isDisabled ? " disabled" : ""}`}
        style={{ borderColor: color }}
      >
        <div className="task-assignee-top">{renderAssignee(assigneeId)}</div>
        <div className="task-content">
          <div className="task-title">{task.name}</div>
          <button
            className={`done-button${isDisabled ? " grey" : ""}`}
            onClick={() => onComplete(task)}
            disabled={isDisabled}
          >
            {icon}
          </button>
        </div>
        <div className="task-label-top">{label}</div>
      </div>
    );
  };

  return (
    <div className="task-list">
      {available.map(t => renderTask(t, "available"))}
      {locked.map(t => renderTask(t, "locked"))}
      {doneTasks.map(t => renderTask(t, "done"))}
    </div>
  );
}
