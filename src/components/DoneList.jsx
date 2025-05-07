// src/components/DoneList.jsx
import React from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";
import "./DoneList.css";  // neues CSS importieren

export default function DoneList({
  tasks = [],
  redeemedPrizes = [],
  onUndo,
  currentUserId
}) {
  const users = useUsers();
  const today = new Date().toISOString().slice(0, 10);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const recentPrizes = redeemedPrizes.filter(
    p => new Date(p.redeemedAt) >= threeDaysAgo
  );

  // Alle Completion-Einträge sammeln
  const allCompletions = tasks.flatMap(task =>
    (task.completions || []).map(c => ({
      ...c,
      taskId: task.id,
      taskName: task.name
    }))
  );

  const todayCompletions = allCompletions.filter(c => c.date === today);
  const olderCompletions = allCompletions.filter(c => c.date < today);

  const hasAnyCompletions =
    todayCompletions.length > 0 || olderCompletions.length > 0;
  const hasAnyPrizes = recentPrizes.length > 0;

  if (!hasAnyCompletions && !hasAnyPrizes) {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <p>Keine erledigten Aufgaben oder Prämien.</p>
      </div>
    );
  }

  const renderAvatar = userId => {
    const user = users.find(u => u.id === userId);
    const color = assigneeColors[userId] || "transparent";
    const name = user?.name?.toLowerCase() || userId;
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

  const formatTimestamp = iso => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month} ${hh}:${mm}`;
  };

  const renderCompletion = list =>
    list.map((c, i) => {
      const user = users.find(u => u.id === c.userId);
      const isOwn = c.userId === currentUserId;
      const color = assigneeColors[c.userId] || "transparent";
      const task = tasks.find(t => t.id === c.taskId);

      return (
        <div
          key={`${c.taskId}-${c.timestamp}-${i}`}
          className="task done"
          style={{
            border: `2px solid ${color}`,
            margin: "0 14px 12px",
            display: "flex",
            alignItems: "center",
            padding: 8
          }}
        >
          {renderAvatar(c.userId)}
          <div style={{ flex: 1 }}>
            <div className="task-title">{c.taskName}</div>
            <div className="done-by">
              Erledigt von {user?.name || c.userName} am{" "}
              {formatTimestamp(c.timestamp || c.date)}
            </div>
          </div>
          {isOwn ? (
            <button
              className="done-button red"
              onClick={() => onUndo(task, "remove", c)}
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

  const renderPrizes = list =>
    list.map(p => {
      const color = "#DAA520";
      const isOwn = p.redeemedById === currentUserId;
      return (
        <div
          key={p.id}
          className="task done"
          style={{
            border: `3px solid ${color}`,
            boxShadow: "0 0 10px rgba(218,165,32,0.7)",
            margin: "0 14px 12px",
            display: "flex",
            alignItems: "center",
            padding: 8,
            background: "#fffbea"
          }}
        >
          {renderAvatar(p.redeemedById)}
          <div style={{ flex: 1 }}>
            <div className="task-title">{p.name}</div>
            <div className="done-by">
              Eingelöst von {p.redeemedBy} am {formatTimestamp(p.redeemedAt)}
            </div>
          </div>
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
      {hasAnyPrizes && (
        <>
          <div className="section-title">Kürzlich eingelöste Prämien</div>
          {renderPrizes(recentPrizes)}
        </>
      )}
      {todayCompletions.length > 0 && (
        <>
          <div className="section-title">Heute erledigt</div>
          {renderCompletion(todayCompletions)}
        </>
      )}
      {olderCompletions.length > 0 && (
        <>
          <div className="section-title">Früher erledigt</div>
          {renderCompletion(olderCompletions)}
        </>
      )}
    </>
  );
}
