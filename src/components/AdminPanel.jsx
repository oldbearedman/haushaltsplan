// src/components/AdminPanel.jsx
import React, { useState } from "react";
import "./AdminPanel.css";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";

export default function AdminPanel({ users, onReset, onCloseAdmin }) {
  const [name, setName] = useState("");
  const [perDay, setPerDay] = useState(1);
  const [intervalDays, setIntervalDays] = useState(1);
  const [points, setPoints] = useState(1);
  const [assignee, setAssignee] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");

  const submit = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    const assignedTo = assignee === "all" ? ["all"] : [assignee];
    await addDoc(collection(db, "tasks"), {
      name,
      points,
      targetCount: perDay,
      assignedTo,
      repeatInterval: intervalDays,
      doneBy: "",
      lastDoneAt: "",
      lastResetDate: "",
      availableFrom: ""
    });
    setSuccessMsg(`"${name}" erfolgreich erstellt`);
    setName(""); setPerDay(1); setIntervalDays(1); setPoints(1); setAssignee("all");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const clearAll = async () => {
    if (!window.confirm("Alle Tasks löschen?")) return;
    const snap = await getDocs(collection(db, "tasks"));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "tasks", d.id))));
    alert("🗑️ Alle Tasks gelöscht");
  };

  return (
    <div className="admin-panel">
      <h2>🔧 Admin-Bereich</h2>

      <div className="admin-controls">
        <button className="admin-btn reset" onClick={onReset}>
          🔄 App zurücksetzen
        </button>
        <button className="admin-btn delete" onClick={clearAll}>
          🗑️ Alle Tasks löschen
        </button>
        <button className="admin-btn add" onClick={onCloseAdmin}>
          ↩️ Zurück
        </button>
      </div>

      <form onSubmit={submit} className="admin-form">
        <h3>Neue Aufgabe anlegen</h3>

        {/* Erfolgsmeldung nun direkt hier */}
        {successMsg && (
          <div className="success-message">
            {successMsg}
          </div>
        )}

        <label>
          Aufgabenname
          <input
            type="text"
            placeholder="z.B. Küche aufräumen"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Wiederholungen pro Tag
          <input
            type="number"
            min="1"
            value={perDay}
            onChange={e => setPerDay(+e.target.value)}
          />
        </label>

        <label>
          Intervall in Tagen
          <input
            type="number"
            min="1"
            value={intervalDays}
            onChange={e => setIntervalDays(+e.target.value)}
          />
        </label>

        <label>
          Punktewert
          <input
            type="number"
            min="1"
            value={points}
            onChange={e => setPoints(+e.target.value)}
          />
        </label>

        <label>
          Zugewiesen an
          <select
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
          >
            <option value="all">Alle Nutzer</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="admin-btn add">
          ➕ Aufgabe hinzufügen
        </button>
      </form>
    </div>
  );
}
