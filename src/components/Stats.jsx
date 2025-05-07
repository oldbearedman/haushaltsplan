import React from "react";

export default function Stats({
  level,
  levelName,
  xpProgress,
  xpToNext,
  points,
  onRedeemTab
}) {
  return (
    <div className="fixed-stats">
      <div className="level-display">
        <div className="level-info">
          Level {level} – {levelName}
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
