// src/hooks/useLevel.js
import { useState, useCallback, useEffect } from "react";

const levelThresholds = Array.from({ length: 99 }, (_, i) => 40 + i * 15);
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
  "Ordnungsoffizier", "Blitzblank-Bischof", "Politur-Profi", "Staubstaat",
  "Kehrkaiser", "Wischwarrior", "Reinlichkeits-Rebell", "Glanzguru",
  "Putzprinzipat", "Hygieneherrscher", "Sauberkeitsstrahl", "Schmutzschlächter",
  "Ordnungsoffizier", "Blitzblank-Brigadier", "Politur-Papst", "Staubstern",
  "Besenboss", "Wischwunderkind", "Reinlichkeitsrakete", "Glanz-Gladiator",
  "Putzphantom", "Hygiene-Hybrid", "Sauberkeits-Spectre", "Schmutzschrecken",
  "Ordnungsoffizier", "Blitzblank-Berserker", "Politur-Prophet", "Staubspuk",
  "Kehrkommandant", "Wischwind", "Reinlichkeits-Ritter", "Glanzgartenlord",
  "Putzpanther", "Hygiene-Hokuspokus", "Sauberkeits-Sammler", "Schmutzschleuder",
  "Ultimativer Saubermann"
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
