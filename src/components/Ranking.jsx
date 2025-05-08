// src/components/Ranking.jsx
import React from "react";
import useLevel from "../hooks/useLevel";
import { assigneeColors } from "../utils/assigneeColors";
import "./Ranking.css";

export default function Ranking({ users }) {
  // Wir sortieren nach XP absteigend (höheres XP → höheres Level)
  const sorted = [...users].sort((a, b) => (b.xp || 0) - (a.xp || 0));

  return (
    <div className="ranking-panel">
      <h2>Rangliste</h2>
      <ul className="ranking-list">
        {sorted.map((u, idx) => {
          // Level und Level-Name aus XP berechnen
          const { level, levelName } = useLevel(u.xp || 0);
          // User-Farbe aus assigneeColors (fallback auf #444)
          const userColor = assigneeColors[u.id] || "#444";
          // Rahmenfarbe je Platz
          const borderColor =
            idx === 0 ? "#FFD700" :
            idx === 1 ? "#C0C0C0" :
            idx === 2 ? "#CD7F32" :
            "transparent";

          return (
            <li
              key={u.id}
              className="ranking-item"
              style={{ borderColor }}
            >
              <img
                src={`/profiles/${u.name.toLowerCase().replace(/\s+/g, "")}.jpg`}
                alt={u.name}
                className="ranking-avatar"
              />
              <div className="ranking-info">
                {/* Level-Name ganz oben, schwarz */}
                <span className="ranking-levelname-container">
                  {levelName}
                </span>
                {/* Username linksbündig und in User-Farbe */}
                <span
                  className="ranking-name"
                  style={{ color: userColor }}
                >
                  {u.name}
                </span>
                {/* Level darunter */}
                <span className="ranking-level">Level {level}</span>
              </div>
              <div className="ranking-points">
                {u.points || 0} P
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
