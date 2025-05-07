// src/components/DoneList.jsx
import React from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";

export default function DoneList({ tasks, onUndo, currentUserId }) {
  const users = useUsers();
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

  const renderAvatar = doneById => {
    const user = users.find(u => u.id === doneById);
    const color = assigneeColors[doneById] || "transparent";
    const name  = user?.name?.toLowerCase() || doneById;
    return (
      <img
        src={`/profiles/${name}.jpg`}
        alt={user?.name || ""}
        style={{
          width: 45,
          height: 45,
          borderRadius: "50%",
          objectFit: "cover",
          border: `2px solid ${color}`,
          marginRight: 8
        }}
      />
    );
  };

  const renderDone = list => list.map(t => {
    const color      = assigneeColors[t.doneById] || "transparent";
    const isOwnDone  = t.doneById === currentUserId;

    return (
      <div
        key={t.id}
        className="task done"
        style={{ border: `2px solid ${color}`, marginBottom: "12px", display: "flex", alignItems: "center" }}
      >
        {renderAvatar(t.doneById)}
        <div style={{ flex: 1 }}>
          <div className="task-title">{t.name}</div>
          <div className="done-by">
            Erledigt von {t.doneBy} am {t.lastDoneAt}
          </div>
        </div>
        {isOwnDone ? (
          <button className="done-button red" onClick={() => onUndo(t)}>
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
