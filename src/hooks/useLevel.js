// src/hooks/useLevel.js
import { useState, useCallback, useEffect } from "react";

// Dynamische XP-Berechnung pro Level
function getXpThreshold(level) {
  const base = 30; // statt 60
  return Math.floor(base + (level - 1) * 8 + Math.pow(level, 1.2));
}

const levelNames = [
  "Looser", "Knecht", "Putzlehrling", "Chaoskind", "Staubfänger",
  "Staublegende", "Dreckbezwinger", "Reinigungsrookie", "Schmutzquerulant",
  "Aufräum-Anfänger", "Sauberkeitslehrling", "Kehrmeister", "Staubgeneral",
  "Besenbrigadier", "Wischkommandant", "Glanzritter", "Polierfürst",
  "Reinigungsadmiral", "Blitzblank-Botschafter", "Sauberkeitskommandeur",
  "Schmutzzerstörer", "Ordnungsoffizier", "Putzprofi", "Hygieneherrscher",
  "Glanzimperator", "Reinigungsregent", "Politurprinz", "Besen-Baron",
  "Staub-Sheriff", "Kehr-Kapitän", "Wachsmarschall", "Reinlichkeitsrächer",
  "Glanz-Guru", "Putzpatron", "Hygienepilot", "Schmutzfink-Retter",
  "Ordnungsorakel", "Blitzblank-Berserker", "Polier-Papst", "Staubflüsterer",
  "Kehrkönig", "Wischwunder", "Reinlichkeits-Rockstar", "Glanzgott",
  "Putzpaparazzo", "Hygienehai", "Sauberkeits-Samurai", "Schmutzsamurai",
  "Ordnungsoffizier", "Blitzblank-Boss", "Politur-Pilot", "Staubsturm",
  "Besen-Berserker", "Wischwikinger", "Reinheitsritter", "Glanzgladiator",
  "Putz-Pate", "Hygieneheld", "Sauberkeits-Sultan", "Schmutzschreck",
  "Blitzblank-Bischof", "Politur-Profi", "Staubstaat", "Kehrkaiser",
  "Wischwarrior", "Reinlichkeits-Rebell", "Glanzguru", "Putzprinzipat",
  "Sauberkeitsstrahl", "Schmutzschlächter", "Blitzblank-Brigadier",
  "Politur-Papst", "Staubstern", "Besenboss", "Wischwunderkind",
  "Reinlichkeitsrakete", "Glanz-Gladiator", "Putzphantom", "Hygiene-Hybrid",
  "Sauberkeits-Spectre", "Schmutzschrecken", "Politur-Prophet", "Staubspuk",
  "Kehrkommandant", "Wischwind", "Reinlichkeits-Ritter", "Glanzgartenlord",
  "Putzpanther", "Hygiene-Hokuspokus", "Sauberkeits-Sammler", "Schmutzschleuder",
  "Ultimativer Saubermann"
];

export default function useLevel(initialXp = 0) {
  const [xp, setXp] = useState(initialXp);
  const [level, setLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0);
  const [xpToNext, setXpToNext] = useState(getXpThreshold(1));

  const calculateLevel = useCallback((totalXp) => {
    let lvl = 1;
    let rem = totalXp;
    let nextXp = getXpThreshold(lvl);

    while (rem >= nextXp) {
      rem -= nextXp;
      lvl++;
      nextXp = getXpThreshold(lvl);
    }

    setLevel(lvl);
    setXpProgress(rem);
    setXpToNext(nextXp);
  }, []);

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
    levelName: levelNames[level - 1] || `Level ${level}`,
    xpProgress,
    xpToNext,
    addXp,
    setXp: resetXp,
  };
}
