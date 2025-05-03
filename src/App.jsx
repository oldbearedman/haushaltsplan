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

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [xp, setXp] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
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
      setTasks(allTasks);

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
    setLevel(lvl);
    setXpToNext(required - prevRequired);
    setXpProgress(totalXP - prevRequired);
  };

  const handleComplete = async (task, action) => {
    if (!selectedUser) return;

    const taskRef = doc(db, "tasks", task.id);
    const userRef = doc(db, "users", selectedUser.id);
    const isMulti = task.name === "Tisch decken & abräumen";
    const current = task.count || 0;
    const target = task.targetCount || 3;

    if (isMulti) {
      if (action === "add" && current < target) {
        const newCount = current + 1;
        const updates = { count: newCount };
        if (newCount === target) updates.doneBy = selectedUser.name;

        await updateDoc(taskRef, updates);
        await updateDoc(userRef, {
          points: increment(task.points),
          xp: increment(task.points),
        });

        const newPoints = points + task.points;
        const newXP = xp + task.points;
        setPoints(newPoints);
        setXp(newXP);
        calculateLevel(newXP);

        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
      }

      if (action === "remove" && current > 0) {
        const newCount = current - 1;
        const updates = {
          count: newCount,
          doneBy: newCount < target ? "" : task.doneBy,
        };

        await updateDoc(taskRef, updates);
        await updateDoc(userRef, {
          points: increment(-task.points),
        });

        const newPoints = points - task.points;
        setPoints(newPoints);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
      }

      return;
    }

    const isDone = !!task.doneBy;
    if (!isDone) {
      await updateDoc(taskRef, { doneBy: selectedUser.name });
      await updateDoc(userRef, {
        points: increment(task.points),
        xp: increment(task.points),
      });

      const newPoints = points + task.points;
      const newXP = xp + task.points;
      setPoints(newPoints);
      setXp(newXP);
      calculateLevel(newXP);

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, doneBy: selectedUser.name } : t));
    } else if (task.doneBy === selectedUser.name) {
      await updateDoc(taskRef, { doneBy: "" });
      await updateDoc(userRef, {
        points: increment(-task.points),
        xp: increment(-task.points),
      });

      const newPoints = points - task.points;
      const newXP = xp - task.points;
      setPoints(newPoints);
      setXp(newXP);
      calculateLevel(newXP);

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, doneBy: "" } : t));
    }
  };

  const handleRedeem = async (cost) => {
    if (points < cost) {
      alert("Nicht genug Punkte!");
      return;
    }

    const userRef = doc(db, "users", selectedUser.id);
    await updateDoc(userRef, { points: increment(-cost) });
    setPoints(points - cost);
  };

  return (
    <div className="app-wrapper">
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
<button className="menu-button" onClick={() => alert("Menü kommt bald!")}>
  ☰
</button>
      </header>

      <div className="top-gap" />

      {selectedUser && (
        <div className="fixed-stats">
          <div className="level-display">
            <div className="level-info">Level {level}</div>
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
              const isMulti = task.name === "Tisch decken & abräumen";
              const current = task.count || 0;
              const target = task.targetCount || 3;
              const isDone = isMulti ? current >= target : !!task.doneBy;
              const canUndo = task.doneBy === selectedUser.name;

              return (
                <div key={task.id} className={`task ${isDone ? "done" : "open"}`}>
                  <div className="task-text">
                    <div className={`task-title ${isDone ? "strikethrough" : ""}`}>
                      {task.name} (+{task.points})
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

                    {isDone && (
                      <div className="done-by">Erledigt von {task.doneBy}</div>
                    )}
                  </div>

                  {isMulti && (!isDone || task.doneBy === selectedUser.name) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {!isDone && (
                        <button
                          className="done-button"
                          onClick={() => handleComplete(task, "add")}
                        >
                          Erledigt
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

                  {!isMulti && (!isDone || canUndo) && (
                    <button
                      className={`done-button ${isDone ? "grey" : ""}`}
                      onClick={() => handleComplete(task)}
                    >
                      {isDone ? "Rückgängig" : "Erledigt"}
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
                <div className="task-title">{reward.name} (-{reward.cost})</div>
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
