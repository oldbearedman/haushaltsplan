// src/components/DoneList.jsx
import React from "react";
import getIcon from "../utils/getIcon";
import { assigneeColors } from "../utils/assigneeColors";

export default function DoneList({ tasks, onUndo }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.lastDoneAt === today);
  const olderTasks = tasks.filter(
    t => t.lastDoneAt && t.lastDoneAt < today
  );

  // Keine erledigten Aufgaben?
  if (todayTasks.length === 0 && olderTasks.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p>Keine erledigten Aufgaben.</p>
      </div>
    );
  }

  return (
    <>
      {todayTasks.length > 0 && (
        <>
          <div className="section-title">Heute erledigt</div>
          {todayTasks.map(t => {
            const assignee = (t.assignedTo || [])[0];
            const color = assigneeColors[assignee] || "transparent";
            return (
              <div
                key={t.id}
                className="task done"
                style={{ border: `2px solid ${color}` }}
              >
                <div className="task-text">
                  <div className="task-title">
                    {getIcon(t.name)} {t.name}
                  </div>
                  <div className="done-by">
                    Erledigt von {t.doneBy} am {t.lastDoneAt}
                  </div>
                </div>
                <button
                  className="done-button red"
                  onClick={() => onUndo(t)}
                >
                  ❌
                </button>
              </div>
            );
          })}
        </>
      )}

      {olderTasks.length > 0 && (
        <>
          <div className="section-title">Früher erledigt</div>
          {olderTasks.map(t => {
            const assignee = (t.assignedTo || [])[0];
            const color = assigneeColors[assignee] || "transparent";
            return (
              <div
                key={t.id}
                className="task done"
                style={{ border: `2px solid ${color}` }}
              >
                <div className="task-text">
                  <div className="task-title">
                    {getIcon(t.name)} {t.name}
                  </div>
                  <div className="done-by">
                    Erledigt von {t.doneBy} am {t.lastDoneAt}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
