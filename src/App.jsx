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

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedUser) return;

      const usersSnap = await getDocs(collection(db, "users"));
      const currentUser = usersSnap.docs.find(u => u.id === selectedUser.id);
      if (currentUser) {
        setPoints(currentUser.data().points || 0);
      }

      const tasksSnap = await getDocs(collection(db, "tasks"));
      const allTasks = tasksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(allTasks);
    };

    loadData();
  }, [selectedUser]);

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
        await updateDoc(taskRef, { count: newCount });

        if (newCount === target) {
          await updateDoc(taskRef, { doneBy: selectedUser.name });
          await updateDoc(userRef, { points: increment(task.points) });
          setPoints(p => p + task.points);
        }

        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  count: newCount,
                  ...(newCount === target ? { doneBy: selectedUser.name } : {})
                }
              : t
          )
        );
      }

      if (action === "remove" && current > 0) {
        const newCount = current - 1;
        const updates = {
          count: newCount,
          doneBy: newCount < target ? "" : task.doneBy,
        };

        if (current === target && task.doneBy === selectedUser.name) {
          await updateDoc(userRef, { points: increment(-task.points) });
          setPoints(p => p - task.points);
        }

        await updateDoc(taskRef, updates);

        setTasks(prev =>
          prev.map(t =>
            t.id === task.id ? { ...t, ...updates } : t
          )
        );
      }

      return;
    }

    const isDone = !!task.doneBy;
    if (!isDone) {
      await updateDoc(taskRef, { doneBy: selectedUser.name });
      await updateDoc(userRef, { points: increment(task.points) });

      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, doneBy: selectedUser.name } : t
        )
      );
      setPoints(prev => prev + task.points);
    } else if (task.doneBy === selectedUser.name) {
      await updateDoc(taskRef, { doneBy: "" });
      await updateDoc(userRef, { points: increment(-task.points) });

      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, doneBy: "" } : t
        )
      );
      setPoints(prev => prev - task.points);
    }
  };

  return (
    <div className="app-wrapper">
      <header>
        {selectedUser && (
          <button className="back-button" onClick={() => setSelectedUser(null)}>
            ←
          </button>
        )}
        <h1>Haushaltsplan</h1>
      </header>

      <div className="top-gap" />

      {!selectedUser ? (
        <UserList onUserSelect={setSelectedUser} />
      ) : (
        <>
          <div className="points-display">Punkte: {points}</div>
          <div className="task-list">
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

                    {!isDone && isMulti && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <button
                          className="done-button"
                          onClick={() => handleComplete(task, "add")}
                        >
                          Erledigt
                        </button>
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
        </>
      )}
    </div>
  );
}

export default App;
