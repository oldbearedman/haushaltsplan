// src/components/DoneList.jsx
import React from "react";
import getIcon from "../utils/getIcon";
import { assigneeColors } from "../utils/assigneeColors";

export default function DoneList({ tasks, onUndo, currentUserId }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.lastDoneAt === today);
  const olderTasks = tasks.filter(t => t.lastDoneAt && t.lastDoneAt < today);

  const hasAny = todayTasks.length > 0 || olderTasks.length > 0;
  if (!hasAny) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p>Keine erledigten Aufgaben.</p>
      </div>
    );
  }

  const renderDone = list => list.map(t => {
    const assigneeId = (t.assignedTo || [])[0];
    const color      = assigneeColors[assigneeId] || "transparent";

    // jetzt sauber über doneById prüfen
    const isOwnDone = t.doneById === currentUserId;

    return (
      <div
        key={t.id}
        className="task done"
        style={{ border: `2px solid ${color}`, marginBottom: "12px" }}
      >
        <div className="task-text">
          <div className="task-title">
            {getIcon(t.name)} {t.name}
          </div>
          <div className="done-by">
            Erledigt von {t.doneBy} am {t.lastDoneAt}
          </div>
        </div>
        {isOwnDone ? (
          <button
            className="done-button red"
            onClick={() => onUndo(t)}
          >
            ❌
          </button>
        ) : (
          <button className="done-button grey" disabled>
            🔒
          </button>
        )}
      </div>
    );
  });

  return (
    <>
      {todayTasks.length > 0 && (
        <>
          <div className="section-title">Heute erledigt</div>
          {renderDone(todayTasks)}
        </>
      )}
      {olderTasks.length > 0 && (
        <>
          <div className="section-title">Früher erledigt</div>
          {renderDone(olderTasks)}
        </>
      )}
    </>
  );
}
