import React, { useState, useEffect } from "react";
import "./App.css";
import UserList from "./UserList";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  increment
} from "firebase/firestore";

const levelThresholds = Array.from({ length: 99 }, (_, i) => 40 + i * 15);

const levelNames = [
  "Looser", "Knecht", "Putzlehrling", "Chaoskind", "Staubfänger",
  "Putzmuffel", "Schluri", "Unordnungsfan", "Lappenlutscher", "Sockenstreuer",
  "Kleiner Held", "Fleißbienchen", "Ordnungsschüler", "Putzazubi", "Klarblicker",
  "Wischlehrer", "Halbprofi", "Streitvermeider", "Routineheld", "Putzprofi",
  "Saugmeister", "Bodenbezwinger", "Flächenglätter", "Waschzauberer", "Kühlschrankdompteur",
  "Besenritter", "Putzdrache", "Bademeister", "Spülmaschinenheld", "Dreckvernichter",
  "Ordnungshüter", "Aufräumkapitän", "Küchenzauberer", "Schmutzmagier", "Wäschechampion",
  "Hygienewächter", "Putzgeneral", "Haushaltsmanager", "Glanzminister", "Wunderwischer",
  "Drecksdompteur", "Spülkrieger", "Alltagsheld", "Putzchampion", "Haushaltsheld",
  "Sauberkeitsguru", "Supermutti", "Hausvater", "Ordnungsboss", "Wunderwesen",
  "Sauberkeitskaiser", "Meister Proper", "Staubkönig", "Putztitan", "Hygienegott",
  "Supersorter", "Familienchef", "Gott des Haushalts", "Haushaltslegende", "Unaufhaltbar",
  "Putzmaschine", "Der Unerreichbare", "Der Perfekte", "Legende", "Halbgott der Ordnung",
  "Putzphänomen", "Der Endgegner", "Hüter des Haushalts", "Übermensch", "Maximalreiniger",
  "Glanzgott", "Finaler Boss", "Der Erhabene", "Der Unermüdliche", "Haushaltsorakel",
  "Heiliger Wischer", "Staubvernichter", "Sankt Ordnung", "Absolute Macht",
  ...Array(21).fill("Ultimativer Saubermann")
];

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [xp, setXp] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [level, setLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0);
  const [xpToNext, setXpToNext] = useState(40);
  const [view, setView] = useState("tasks");

  useEffect(() => {
    const loadData = async () => {
      if (!selectedUser) return;

      const usersSnap = await getDocs(collection(db, "users"));
      const currentUser = usersSnap.docs.find(u => u.id === selectedUser.id);
      if (currentUser) {
        const totalPoints = currentUser.data().points || 0;
        const totalXP = currentUser.data().xp || 0;
        setPoints(totalPoints);
        setXp(totalXP);
        calculateLevel(totalXP);
      }

      const tasksSnap = await getDocs(collection(db, "tasks"));
      const allTasks = tasksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const needsReset = allTasks.some((task) => {
        const isRepeat = !!task.repeatInterval;
        const isDone = !!task.doneBy;

        if (isRepeat && isDone && task.availableFrom && todayStr >= task.availableFrom) {
          return true;
        }

        if (!isRepeat && task.lastResetDate !== todayStr) {
          return true;
        }

        return false;
      });

      if (needsReset) {
        const batch = allTasks.map((task) => {
          const isRepeat = !!task.repeatInterval;
          const isDone = !!task.doneBy;

          if (isRepeat) {
            if (isDone && task.availableFrom && todayStr >= task.availableFrom) {
              const updates = { doneBy: "", lastResetDate: todayStr };
              return updateDoc(doc(db, "tasks", task.id), updates).then(() => ({
                ...task,
                ...updates
              }));
            }
            return Promise.resolve(task);
          }

          if (task.lastResetDate !== todayStr) {
            const updates = { doneBy: "", lastResetDate: todayStr };
            return updateDoc(doc(db, "tasks", task.id), updates).then(() => ({
              ...task,
              ...updates
            }));
          }

          return Promise.resolve(task);
        });

        const updatedTasks = await Promise.all(batch);
        setTasks(updatedTasks);
      } else {
        setTasks(allTasks);
      }

      const rewardsSnap = await getDocs(collection(db, "rewards"));
      const allRewards = rewardsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRewards(allRewards);
    };

    loadData();
  }, [selectedUser]);
  const calculateLevel = (totalXP) => {
    let lvl = 1;
    let required = levelThresholds[0];
    while (lvl < levelThresholds.length && totalXP >= required) {
      lvl++;
      required += levelThresholds[lvl - 1];
    }
    const prevRequired = lvl <= 1 ? 0 : levelThresholds.slice(0, lvl - 1).reduce((a, b) => a + b, 0);

    if (lvl > level) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    setLevel(lvl);
    setXpToNext(required - prevRequired);
    setXpProgress(totalXP - prevRequired);
  };

  const handleReset = async () => {
    if (!window.confirm("Willst du wirklich alles zurücksetzen?")) return;

    const tasksSnap = await getDocs(collection(db, "tasks"));
    const usersSnap = await getDocs(collection(db, "users"));

    for (const taskDoc of tasksSnap.docs) {
      const taskRef = doc(db, "tasks", taskDoc.id);
      await updateDoc(taskRef, {
        doneBy: "",
        count: 0,
        availableFrom: "",
        lastResetDate: "2025-05-03",
      });
    }

    for (const userDoc of usersSnap.docs) {
      const userRef = doc(db, "users", userDoc.id);
      await updateDoc(userRef, {
        points: 0,
        xp: 0,
      });
    }

    alert("Alle Aufgaben und Punkte wurden zurückgesetzt.");
    window.location.reload();
  };

  return (
    <div className="app-wrapper">
      {showLevelUp && (
        <div className="level-up-popup">
          🎉 Level {level} erreicht – {levelNames[level - 1]}!
        </div>
      )}

      <header>
        {selectedUser && (
          <button
            className="back-button"
            onClick={() => {
              if (view === "rewards") setView("tasks");
              else setSelectedUser(null);
            }}
          >
            ←
          </button>
        )}
        <h1>Haushaltsplan</h1>
        {selectedUser && (
          <button
            className="menu-button"
            onClick={() => {
              const action = prompt("Menü:\n1 = Reset (Entwicklerfunktion)");
              if (action === "1") handleReset();
              else alert("Menü kommt bald!");
            }}
          >
            ☰
          </button>
        )}
      </header>

      <div className="top-gap" />

      {selectedUser && (
        <div className="fixed-stats">
          <div className="level-display">
            <div className="level-info">Level {level} – {levelNames[level - 1]}</div>
            <div className="xp-bar">
              <div
                className="xp-fill"
                style={{ width: `${(xpProgress / xpToNext) * 100}%` }}
              ></div>
            </div>
            <div className="xp-label">
              XP: {xpProgress} / {xpToNext}
            </div>
          </div>
          <div
            className="points-display"
            onClick={() => setView("rewards")}
            style={{ cursor: "pointer" }}
          >
            Punkte: {points}
          </div>
        </div>
      )}
      {!selectedUser ? (
        <UserList onUserSelect={setSelectedUser} />
      ) : view === "tasks" ? (
        <div className="task-list">
          <div className="section-title">Aufgabenliste</div>
          {tasks
            .sort((a, b) => {
              const doneA = !!a.doneBy || (a.count >= a.targetCount);
              const doneB = !!b.doneBy || (b.count >= b.targetCount);
              return doneA - doneB;
            })
            .map((task) => {
              const isMulti = typeof task.targetCount === "number";
              const current = task.count || 0;
              const target = task.targetCount || 3;
              const isDone = isMulti ? current >= target : !!task.doneBy;
              const canUndo = task.doneBy === selectedUser.name;
              const locked =
                task.repeatInterval &&
                task.doneBy &&
                task.availableFrom &&
                task.availableFrom > new Date().toISOString().split("T")[0];

              return (
                <div key={task.id} className={`task ${isDone ? "done" : "open"}`}>
                  <div className="task-text">
                    <div className={`task-title ${isDone ? "strikethrough" : ""}`}>
                      {task.name}
                    </div>

                    {isMulti && (
                      <div className="multi-circles">
                        {[...Array(target)].map((_, i) => (
                          <span
                            key={i}
                            className={`circle ${i < current ? "filled" : ""}`}
                          />
                        ))}
                      </div>
                    )}

                    {locked && (
                      <div className="done-by">Verfügbar ab: {task.availableFrom}</div>
                    )}

                    {isDone && !locked && (
                      <div className="done-by">Erledigt von {task.doneBy}</div>
                    )}
                  </div>

                  {!locked && isMulti && (!isDone || task.doneBy === selectedUser.name) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {!isDone && (
                        <button
                          className="done-button"
                          onClick={() => handleComplete(task, "add")}
                        >
                          +{task.points}
                        </button>
                      )}
                      {current > 0 && (
                        <button
                          className="done-button grey"
                          onClick={() => handleComplete(task, "remove")}
                        >
                          Rückgängig
                        </button>
                      )}
                    </div>
                  )}

                  {!locked && !isMulti && (!isDone || canUndo) && (
                    <button
                      className={`done-button ${isDone ? "grey" : ""}`}
                      onClick={() => handleComplete(task)}
                    >
                      {isDone ? "Rückgängig" : `+${task.points}`}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="task-list">
          <div className="section-title">Punkte einlösen</div>
          {rewards.map((reward) => (
            <div key={reward.id} className="task reward">
              <div className="task-text">
                <div className="task-title">
                  {reward.name} (-{reward.cost})
                </div>
              </div>
              <button
                className="done-button"
                onClick={() => handleRedeem(reward.cost)}
              >
                Einlösen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
