// src/components/RewardsList.jsx
import React from "react";
import { FaGift } from "react-icons/fa";

export default function RewardsList({ rewards, onRedeem }) {
  if (rewards.length === 0) {
    return <p>Keine Prämien verfügbar.</p>;
  }

  return (
    <div className="task-list">
      {rewards.map(r => (
        <div key={r.id} className="task reward">
          <div className="task-text">
            <div className="task-title">
              <FaGift /> {r.name} (–{r.cost})
            </div>
          </div>
          <button className="done-button" onClick={() => onRedeem(r.cost)}>
            Einlösen
          </button>
        </div>
      ))}
    </div>
  );
}
