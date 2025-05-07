// src/components/DoneList.jsx
import React from "react";
import getIcon from "../utils/getIcon";
import { assigneeColors } from "../utils/assigneeColors";

export default function DoneList({ tasks, onUndo, currentUserId, currentUserName }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.lastDoneAt === today);
  const olderTasks = tasks.filter(
    t => t.lastDoneAt && t.lastDoneAt < today
  );

  // Wenn überhaupt keine erledigten Tasks
  const hasAny = todayTasks.length > 0 || olderTasks.length > 0;
  if (!hasAny) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p>Keine erledigten Aufgaben.</p>
      </div>
    );
  }

  const renderTask = t => {
    const assignee    = (t.assignedTo || [])[0];
    const color       = assigneeColors[assignee] || "transparent";
    const isOwnAssgn  = assignee === currentUserId;
    const isAllAssgn  = (t.assignedTo || []).includes("all");
    const didIt       = t.doneBy === currentUserName;
    // Erlaubt undo, wenn:
    // • persönliche Aufgabe UND eigener Account
    // • ODER „für alle“ UND man selbst war, der sie erledigt hat
    const canUndo     = (isOwnAssgn) || (isAllAssgn && didIt);

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
        {canUndo ? (
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
  };

  return (
    <>
      {todayTasks.length > 0 && (
        <>
          <div className="section-title">Heute erledigt</div>
          {todayTasks.map(renderTask)}
        </>
      )}

      {olderTasks.length > 0 && (
        <>
          <div className="section-title">Früher erledigt</div>
          {olderTasks.map(renderTask)}
        </>
      )}
    </>
  );
}
