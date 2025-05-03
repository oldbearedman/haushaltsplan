import React, { useState } from "react";
import "./App.css";

const tasks = [
  { id: 1, text: "Staubsaugen", points: 30 },
  { id: 2, text: "Abwaschen", points: 20 },
  { id: 3, text: "Wäsche waschen", points: 50 },
  { id: 4, text: "Müll rausbringen", points: 15 },
  { id: 5, text: "Fenster putzen", points: 40 },
  { id: 6, text: "Einkaufen", points: 25 },
  { id: 7, text: "Boden wischen", points: 30 },
  { id: 8, text: "Gartenarbeit", points: 35 },
  { id: 9, text: "Bad putzen", points: 50 },
  { id: 10, text: "Küche aufräumen", points: 40 }
];

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);

  const handleTaskComplete = (taskId, taskPoints) => {
    if (completedTasks.includes(taskId)) {
      // Wenn die Aufgabe bereits erledigt ist, wird sie wieder als nicht erledigt markiert
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
      setPoints(points - taskPoints); // Punkte wieder abziehen
    } else {
      // Wenn die Aufgabe noch nicht erledigt ist, wird sie als erledigt markiert
      setCompletedTasks([...completedTasks, taskId]);
      setPoints(points + taskPoints); // Punkte hinzufügen
    }
  };

  return (
    <div className="app-wrapper">
      <header>
        <h1>Haushaltsplan</h1>
      </header>

      {!selectedUser ? (
        <div className="name-select">
          <button className="name-button" onClick={() => setSelectedUser("Taylor")}>Taylor</button>
          <button className="name-button" onClick={() => setSelectedUser("Olivia")}>Olivia</button>
          <button className="name-button" onClick={() => setSelectedUser("Brandon")}>Brandon</button>
        </div>
      ) : (
        <div className="task-view">
          <div className="points-display">
            Punkte: {points}
          </div>

          <div className="task-list">
            {tasks.map((task) => (
          <div
              key={task.id}
  className={`task ${completedTasks.includes(task.id) ? "done" : "open"}`}
>
  <div className="task-text">{task.text}</div>
  <div className="done-button" onClick={() => handleTaskComplete(task.id, task.points)}>
    {completedTasks.includes(task.id) ? "Erledigt" : `+${task.points}`}
  </div>
</div>

            ))}
          </div>

          {tasks.length > 5 && <div className="scroll-message">Nach unten scrollen, um mehr Aufgaben zu sehen.</div>}
        </div>
      )}
    </div>
  );
}

export default App;
