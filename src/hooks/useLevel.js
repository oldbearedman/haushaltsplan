// src/hooks/useLevel.js
import { useState, useCallback, useEffect } from "react";

const levelThresholds = Array.from({ length: 99 }, (_, i) => 40 + i * 15);
const levelNames = [
  "Looser", "Knecht", "Putzlehrling", "Chaoskind", "Staubfänger",
  /* … restliche Namen … */,
  ...Array(21).fill("Ultimativer Saubermann")
];

export default function useLevel(initialXp = 0) {
  const [xp, setXp] = useState(initialXp);
  const [level, setLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0);
  const [xpToNext, setXpToNext] = useState(levelThresholds[0]);

  const calculateLevel = useCallback((totalXp) => {
    let lvl = 1;
    let need = levelThresholds[0];
    let rem = totalXp;

    while (lvl < levelThresholds.length && rem >= need) {
      rem -= need;
      lvl++;
      need = levelThresholds[lvl - 1];
    }
    setLevel(lvl);
    setXpProgress(rem);
    setXpToNext(need);
  }, []);

  // initial nur einmal ausführen
  useEffect(() => {
    calculateLevel(initialXp);
  }, [initialXp, calculateLevel]);

  const addXp = useCallback((delta) => {
    setXp(old => {
      const next = old + delta;
      calculateLevel(next);
      return next;
    });
  }, [calculateLevel]);

  const resetXp = useCallback((newTotal) => {
    setXp(newTotal);
    calculateLevel(newTotal);
  }, [calculateLevel]);

  return {
    xp,
    level,
    levelName: levelNames[level - 1],
    xpProgress,
    xpToNext,
    addXp,
    setXp: resetXp,
  };
}
