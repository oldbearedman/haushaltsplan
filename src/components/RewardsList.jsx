// src/components/RewardsList.jsx
import React from "react";
import "./RewardsList.css";

export default function RewardsList({ rewards, points, onRedeem, currentUserId }) {
  // nur sichtbare Prämien filtern
  const visibleRewards = rewards.filter(r =>
    r.assignedTo?.includes("all") ||
    r.assignedTo?.includes(currentUserId)
  );

  return (
    <div className="rewards-panel">
      <h2 className="rewards-header">Punkte einlösen</h2>
      <div className="rewards-list-wrapper">
        {visibleRewards.map(r => {
          const canRedeem = points >= r.cost;
          return (
            <div
              key={r.id}
              className={`reward-card${canRedeem ? "" : " disabled"}`}
            >
              <div className="reward-content">
                <div className="reward-name">{r.name}</div>
                <button
                  className="redeem-button"
                  disabled={!canRedeem}
                  onClick={() => canRedeem && onRedeem(r)}
                >
                  <span className="redeem-cost">{r.cost}</span>
                  <span className="redeem-icon">🪙</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
