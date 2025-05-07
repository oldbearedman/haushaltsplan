// src/components/Stats.jsx
import React from "react";

export default function Stats({
  level,
  levelName,
  xpProgress,
  xpToNext,
  points,
  onRedeemTab
}) {
  // Pro 2 Level ein Stern, maximal 37 Sterne
  const starIndex = Math.min(Math.ceil(level / 2), 37);

  return (
    <div className="fixed-stats">
      <div className="level-display">
        <div className="level-info">
          Level {level} – {levelName}
          <img
            src={`/icons/star${starIndex}.webp`}
            alt={`Stern ${starIndex}`}
            style={{
              width: "9px",
              height: "9px",
              marginLeft: "9px",
              position: "relative",
              top: "-2px"    // hebt den Stern leicht an
            }}
          />
        </div>
        <div className="xp-bar">
          <div
            className="xp-fill"
            style={{ width: `${(xpProgress / xpToNext) * 100}%` }}
          />
        </div>
        <div className="xp-label">
          XP: {xpProgress} / {xpToNext}
        </div>
      </div>
      <div className="points-display" onClick={onRedeemTab}>
        🪙 {points}
      </div>
    </div>
  );
}
