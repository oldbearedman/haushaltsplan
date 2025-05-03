// src/App.jsx
import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
  increment
} from "firebase/firestore";
import "./App.css";

const users = ["Brandon", "Olivia", "Taylor"];

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchData = async () => {
      const userRef = doc(db, "users", selectedUser);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setPoints(userSnap.data().points || 0);
      }

      const tasksRef = collection(db, "users", selectedUser, "tasks");
      const tasksSnap = await getDocs(tasksRef);
      const taskList = tasksSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskList);
    };

    fetchData();
  }, [selectedUser]);

  const handleComplete = async (taskId, taskPoints) => {
    const taskRef = doc(db, "users", selectedUser, "tasks", taskId);
    await updateDoc(taskRef, { done: true });

    const userRef = doc(db, "users", selectedUser);
    await updateDoc(userRef, {
      points: increment(taskPoints)
    });

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, done: true } : t
      )
    );
    setPoints(prev => prev + taskPoints);
  };

  if (!selectedUser) {
    return (
      <div className="app">
        <h1>Haushaltsplan</h1>
        {users.map(name => (
          <button key={name} onClick={() => setSelectedUser(name)}>
            {name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Haushaltsplan</h1>
      <div className="points">Punkte: {points}</div>
      <div className="task-list">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`task ${task.done ? "done" : "todo"}`}
          >
            <span>{task.name} ({task.points > 0 ? "+" : ""}{task.points})</span>
            {!task.done && (
              <button onClick={() => handleComplete(task.id, task.points)}>
                Erledigt
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
