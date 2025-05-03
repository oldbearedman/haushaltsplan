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

      // Punkte laden
      const usersSnap = await getDocs(collection(db, "users"));
      const currentUser = usersSnap.docs.find(u => u.id === selectedUser.id);
      if (currentUser) {
        setPoints(currentUser.data().points || 0);
      }

      // Aufgaben laden
      const tasksSnap = await getDocs(collection(db, "tasks"));
      const allTasks = tasksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(allTasks);
    };

    loadData();
  }, [selectedUser]);

  const handleComplete = async (task) => {
    if (!selectedUser) return;

    const taskRef = doc(db, "tasks", task.id);
    const userRef = doc(db, "users", selectedUser.id);

    if (!task.doneBy) {
      // Aufgabe erledigen
      await updateDoc(taskRef, { doneBy: selectedUser.name });
      await updateDoc(userRef, {
        points: increment(task.points),
      });

      setPoints((prev) => prev + task.points);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, doneBy: selectedUser.name } : t
        )
      );
    } else if (task.doneBy === selectedUser.name) {
      // Aufgabe zurücknehmen
      await updateDoc(taskRef, { doneBy: "" });
      await updateDoc(userRef, {
        points: increment(-task.points),
      });

      setPoints((prev) => prev - task.points);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, doneBy: "" } : t
        )
      );
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

      {!selectedUser ? (
        <UserList onUserSelect={setSelectedUser} />
      ) : (
        <div className="task-view">
          <div className="points-display">Punkte: {points}</div>
          <div className="task-list">
            {tasks.map((task) => {
              const isDone = task.doneBy !== "";
              const canUndo = task.doneBy === selectedUser.name;

              return (
                <div
                  key={task.id}
                  className={`task ${isDone ? "done" : "open"}`}
                >
                  <div className="task-text">
                    <div className={`task-title ${isDone ? "strikethrough" : ""}`}>
                      {task.name} (+{task.points})
                    </div>
                    {isDone && (
                      <div className="done-by">Erledigt von {task.doneBy}</div>
                    )}
                  </div>
                  {(!isDone || canUndo) && (
                    <button
                      className="done-button"
                      onClick={() => handleComplete(task)}
                    >
                      {isDone ? "Rückgängig" : "Erledigt"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
