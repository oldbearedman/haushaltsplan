// src/components/TaskForm.jsx
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function TaskForm({ users }) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState(1);
  const [targetCount, setTargetCount] = useState(1);
  const [repeatInterval, setRepeatInterval] = useState(0);
  const [assignee, setAssignee] = useState("all");

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    const assignedTo = assignee === "all" ? ["all"] : [assignee];
    await addDoc(collection(db, "tasks"), {
      name,
      points,
      targetCount,
      repeatInterval: repeatInterval || null,
      assignedTo,
      doneBy: "",
      lastDoneAt: "",
      availableFrom: "",
      lastResetDate: ""
    });
    setName("");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        placeholder="Aufgabenname"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        type="number"
        min="1"
        value={points}
        onChange={e => setPoints(+e.target.value)}
        style={{ width: 60 }}
      />
      <input
        type="number"
        min="1"
        value={targetCount}
        onChange={e => setTargetCount(+e.target.value)}
        style={{ width: 60 }}
      />
      <input
        type="number"
        min="0"
        placeholder="Intervall (Tage)"
        value={repeatInterval}
        onChange={e => setRepeatInterval(+e.target.value)}
        style={{ width: 80 }}
      />
      <select
        value={assignee}
        onChange={e => setAssignee(e.target.value)}
      >
        <option value="all">Alle</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <button type="submit">➕ Aufgabe</button>
    </form>
  );
}
