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
    const assignedTo = task.assignedTo || [];
    const isLocked =
      (task.availableFrom && task.availableFrom > today) ||
      (!assignedTo.includes("all") && !assignedTo.includes(currentUserId));

    const completions = Array.isArray(task.completions) ? task.completions : [];
    const isMulti = !!task.targetCount;
    const doneMulti = isMulti && completions.length >= task.targetCount;
    const doneSingle = !!task.doneBy;
    const enriched = { ...task, assignedTo };

    if (doneSingle || doneMulti) {
      doneTasks.push(enriched);
    } else if (isLocked) {
      locked.push(enriched);
    } else {
      available.push(enriched);
    }
  });

  const renderAssignee = assignedTo => {
    const shownUsers = assignedTo.includes("all")
      ? users
      : users.filter(u => assignedTo.includes(u.id));
    return (
      <div className="assignees-stack">
        {shownUsers.map((u, idx) => (
          <img
            key={u.id}
            src={`/profiles/${u.name.toLowerCase().replace(/\s+/g, "")}.jpg`}
            alt={u.name}
            className="assignee-avatar small"
            style={{
              borderColor: assigneeColors[u.id] || "transparent",
              zIndex: users.length - idx
            }}
          />
        ))}
      </div>
    );
  };

  const renderTask = (task, status) => {
    const assignedTo = task.assignedTo || [];
    const color =
      assignedTo.includes(currentUserId)
        ? assigneeColors[currentUserId]
        : "transparent";

    let label;
    if (status === "done") {
      label = task.availableFrom
        ? `Zu erledigen am ${task.availableFrom}`
        : "Heute erledigt";
    } else if (task.availableFrom && task.availableFrom > today) {
      label = `Zu erledigen am ${task.availableFrom}`;
    } else if (
      !assignedTo.includes("all") &&
      !assignedTo.includes(currentUserId)
    ) {
      const names = users
        .filter(u => assignedTo.includes(u.id))
        .map(u => u.name)
        .join(", ");
      label = `Zu erledigen von ${names}`;
    } else {
      label = "Heute zu erledigen";
    }

    const isDisabled = status !== "available";
    const icon =
      status === "available"
        ? `🪙 +${task.points}`
        : status === "done"
        ? "🔄"
        : <span style={{ color: "#222" }}>🔒</span>;

    const completions = Array.isArray(task.completions) ? task.completions : [];
    const doneToday = completions.filter(c => c.date === today).length;

    return (
      <div
        key={`${task.id}-${status}`}
        className={`task-card${isDisabled ? " disabled" : ""}`}
        style={{ borderColor: color }}
      >
        <div className="task-assignee-top">
          {renderAssignee(assignedTo)}
        </div>
        {task.targetCount > 1 && (
          <div className="dot-progress">
            {Array.from({ length: task.targetCount }).map((_, i) => (
              <span
                key={i}
                className={i < doneToday ? "dot done" : "dot"}
              />
            ))}
          </div>
        )}
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
