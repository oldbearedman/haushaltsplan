// src/components/TaskList.jsx
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

  return (
    <div className="task-list">
      {tasks
        // Nur noch nach erledigt-Status filtern, nicht nach availableFrom
        .filter(task => !task.doneBy)
        .map(task => {
          const assignee = (task.assignedTo || [])[0];
          const color    = assigneeColors[assignee] || "transparent";

          // gesperrt, wenn nicht dir zugewiesen
          const notYours = assignee !== currentUserId && assignee !== "all";
          // oder wenn noch nicht verfügbar
          const lockedByDate = task.availableFrom && task.availableFrom > today;

          const isLocked = notYours || lockedByDate;

          return (
            <div
              key={task.id}
              className={`task${isLocked ? " disabled" : ""}`}
              style={{ border: `2px solid ${color}` }}
            >
              <div className="task-text">
                <div className="task-title">
                  {getIcon(task.name)} {task.name}
                </div>
                {lockedByDate && (
                  <div className="task-locked">
                    Verfügbar ab {task.availableFrom}
                  </div>
                )}
                {notYours && (
                  <div className="task-locked">
                    Zugewiesen an andere
                  </div>
                )}
              </div>
              {isLocked ? (
                <button className="done-button grey" disabled>
                  🔒
                </button>
              ) : (
                <button
                  className="done-button"
                  onClick={() => onComplete(task)}
                >
                  🪙 +{task.points}
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}
