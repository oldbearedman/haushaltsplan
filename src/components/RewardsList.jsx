// src/components/RewardsList.jsx
import React from "react";

export default function RewardsList({ rewards, points, onRedeem }) {
  if (rewards.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p>Keine Prämien verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {rewards.map(r => {
        const canRedeem = points >= r.cost;
        return (
          <div
            key={r.id}
            className="task reward"
            style={{
              border: `2px solid gold`,
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div className="task-text">
              <div
                className="task-title"
                style={{ fontWeight: "600", fontSize: "1rem" }}
              >
                {r.name} (–{r.cost})
              </div>
            </div>
            <button
              className={`done-button ${canRedeem ? "" : "grey"}`}
              onClick={() => onRedeem(r)}
              disabled={!canRedeem}
            >
              {canRedeem ? "Einlösen" : "Zu wenig Punkte"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
