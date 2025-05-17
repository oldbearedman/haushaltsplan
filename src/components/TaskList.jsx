// src/components/TaskList.jsx
import React, { useState, useRef, useEffect } from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";
import "./TaskList.css";

export default function TaskList({ tasks, onComplete, currentUserId }) {
  const users = useUsers();
  const today = new Date().toISOString().slice(0, 10);
  const [lastResetTime, setLastResetTime] = useState(null);

  useEffect(() => {
    const storedTime = localStorage.getItem("lastResetTime");
    if (storedTime) setLastResetTime(parseInt(storedTime));
  }, []);

  const CATEGORY_ORDER = [
    "Küche",
    "Wohnzimmer",
    "Wäsche",
    "Badezimmer",
    "Schlafzimmer",
    "Kinderzimmer",
    "Büro",
    "Flur",
    "Saugen",
    "Wischen",
    "Sonstiges"
  ];

  const [openCats, setOpenCats] = useState({});
  const catRefs = useRef({});

  const toggleCat = cat =>
    setOpenCats(prev => {
      const next = { ...prev, [cat]: !prev[cat] };
      if (!prev[cat] && catRefs.current[cat]) {
        setTimeout(() => {
          catRefs.current[cat].scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
      return next;
    });

  const grouped = tasks.reduce((acc, task) => {
    const cat = CATEGORY_ORDER.includes(task.category) ? task.category : "Küche";
    acc[cat] = acc[cat] || [];
    acc[cat].push(task);
    return acc;
  }, {});

  const splitByStatus = list => {
    const available = [], locked = [], done = [];
    list.forEach(task => {
      const assignedTo = task.assignedTo || [];
      const completions = Array.isArray(task.completions) ? task.completions : [];
      const isMulti = task.targetCount > 1;

      const lastDate = isMulti
        ? (completions.map(c => c.date).sort().pop() || "")
        : task.lastDoneAt || "";

      let nextAvailable = "";
      if (lastDate && task.repeatInterval) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + task.repeatInterval);
        nextAvailable = d.toISOString().slice(0, 10);
      }

      if (!isMulti && lastDate && nextAvailable > today) {
        locked.push({ ...task, nextAvailable });
      } else if (task.doneBy || (isMulti && completions.length >= task.targetCount)) {
        done.push(task);
      } else if (
        (task.availableFrom && task.availableFrom > today) ||
        (!assignedTo.includes("all") && !assignedTo.includes(currentUserId))
      ) {
        locked.push(task);
      } else {
        available.push(task);
      }
    });
    return { available, locked, done };
  };

  const renderAssignee = assignedTo => {
    const shown = assignedTo.includes("all")
      ? users
      : users.filter(u => assignedTo.includes(u.id));
    return (
      <div className="assignees-stack">
        {shown.map((u, i) => (
          <img
            key={u.id}
            src={`/profiles/${u.name.toLowerCase()}.jpg`}
            alt={u.name}
            className="assignee-avatar small"
            style={{ borderColor: assigneeColors[u.id], zIndex: shown.length - i }}
          />
        ))}
      </div>
    );
  };

  const renderTaskCard = (task, status) => {
    const assignedTo = task.assignedTo || [];
    const color = assignedTo.includes(currentUserId)
      ? assigneeColors[currentUserId]
      : "transparent";

    const completions = Array.isArray(task.completions) ? task.completions : [];
    const isMulti = task.targetCount > 1;
    const doneToday = isMulti
      ? completions.filter(c => c.date === today).length
      : 0;

    let icon, label;
    if (status === "available") {
      icon = `🪙 +${task.points}`;
      label = isMulti
        ? `Noch ${task.targetCount - doneToday} von ${task.targetCount} heute`
        : "Heute zu erledigen";
    } else if (status === "locked") {
      icon = <span>🔒</span>;
      label = task.nextAvailable
        ? `Verfügbar ab ${task.nextAvailable}`
        : "Gesperrt";
    } else {
      icon = "🔄";
      label = "Heute erledigt";
    }

    const isDisabled = status !== "available";

    return (
      <div
        key={`${task.id}-${status}`}
        className={`task-card${isDisabled ? " disabled" : ""}`}
        style={{ borderColor: color }}
      >
        <div className="task-assignee-top">
          {renderAssignee(assignedTo)}
        </div>
        {isMulti && (
          <div className="dot-progress">
            {Array.from({ length: task.targetCount }).map((_, i) => (
              <span key={i} className={i < doneToday ? "dot done" : "dot"} />
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
      {CATEGORY_ORDER.map(cat => {
        const list = grouped[cat] || [];
        const { available, locked, done } = splitByStatus(list);
        const isOpen = !!openCats[cat];

        return (
          <div
            key={cat}
            className="task-category"
            ref={el => (catRefs.current[cat] = el)}
          >
            <div className="category-header" onClick={() => toggleCat(cat)}>
              <span>{cat}</span>
              <span className="chevron">{isOpen ? "▼" : "▶"}</span>
            </div>
            {isOpen && (
              <>
                {available.map(t => renderTaskCard(t, "available"))}
                {locked.map(t => renderTaskCard(t, "locked"))}
                {done.map(t => renderTaskCard(t, "done"))}
              </>
            )}
          </div>
        );
      })}

      {lastResetTime && (
        <div style={{
          textAlign: "center",
          fontSize: "0.75rem",
          marginTop: "24px",
          color: "#888"
        }}>
          Letzter automatischer Reset:{" "}
          {new Date(lastResetTime).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}{" "}
          um {new Date(lastResetTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
        </div>
      )}
    </div>
  );
}
