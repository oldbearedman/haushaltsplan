// src/components/DoneList.jsx
import React from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";

export default function DoneList({
  tasks = [],
  redeemedPrizes = [],       // Liste der eingelösten Prämien
  onUndo,
  currentUserId
}) {
  const users = useUsers();
  const today = new Date().toISOString().slice(0, 10);

  // erledigte Tasks
  const todayTasks = tasks.filter(t => t.lastDoneAt === today);
  const olderTasks = tasks.filter(t => t.lastDoneAt && t.lastDoneAt < today);

  const hasAnyTasks = todayTasks.length > 0 || olderTasks.length > 0;
  const hasAnyPrizes = redeemedPrizes.length > 0;

  if (!hasAnyTasks && !hasAnyPrizes) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p>Keine erledigten Aufgaben oder Prämien.</p>
      </div>
    );
  }

  // Avatar-Renderer
  const renderAvatar = userId => {
    const user = users.find(u => u.id === userId);
    const color = assigneeColors[userId] || "transparent";
    const name  = user?.name?.toLowerCase() || userId;
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

  // Karten für erledigte Tasks
  const renderDoneTask = list =>
    list.map(t => {
      const color     = assigneeColors[t.doneById] || "transparent";
      const isOwnDone = t.doneById === currentUserId;

      return (
        <div
          key={t.id}
          className="task done"
          style={{
            border: `2px solid ${color}`,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            padding: "8px"
          }}
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

  // Karten für eingelöste Prämien
  const renderPrizes = list =>
    list.map(p => {
      const color   = "#DAA520"; // gold
      const isOwn   = p.redeemedById === currentUserId;
      return (
        <div
          key={p.id}
          className="task done"
          style={{
            border: `3px solid ${color}`,
            boxShadow: "0 0 10px rgba(218,165,32,0.7)",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            padding: "8px",
            background: "#fffbea"
          }}
        >
          {renderAvatar(p.redeemedById)}
          <div style={{ flex: 1 }}>
            <div className="task-title">{p.name}</div>
            <div className="done-by">
              Eingelöst von {p.redeemedBy} am {p.redeemedAt}
            </div>
          </div>
          {/* drei Sterne */}
          <div style={{ fontSize: "1.2rem", marginRight: 8 }}>⭐️⭐️⭐️</div>
          {isOwn && (
            <button className="done-button grey" disabled>
              🎉
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
          {renderDoneTask(todayTasks)}
        </>
      )}
      {olderTasks.length > 0 && (
        <>
          <div className="section-title">Früher erledigt</div>
          {renderDoneTask(olderTasks)}
        </>
      )}
      {hasAnyPrizes && (
        <>
          <div className="section-title">Eingelöste Prämien</div>
          {renderPrizes(redeemedPrizes)}
        </>
      )}
    </>
  );
}
