import React from 'react';

export default function LevelStats({ level, points }) {
  return (
    <div className="level-stats">
      <h2>Level {level}</h2>
      <p>Punkte: {points}</p>
    </div>
  );
}