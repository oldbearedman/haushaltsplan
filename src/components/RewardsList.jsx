// src/components/RewardsList.jsx
import React from "react";
import "./RewardsList.css";

export default function RewardsList({ rewards, points, onRedeem }) {
  return (
    <div className="rewards-list">
      <h2 className="rewards-header">Punkte einlösen</h2>
      {rewards.map(r => {
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
  );
}
