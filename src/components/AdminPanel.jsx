// src/components/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";
import TaskForm from "./TaskForm";
import "./AdminPanel.css";
import "./TaskList.css";
import { assigneeColors } from "../utils/assigneeColors";

export default function AdminPanel({ users, onReset, onResetPrizes, onCloseAdmin }) {
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskData, setTaskData] = useState({ name: "", points: 0, assignedTo: ["all"] });
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [prizes, setPrizes] = useState([]);
  const [editingPrizeId, setEditingPrizeId] = useState(null);
  const [prizeData, setPrizeData] = useState({ name: "", cost: 0, assignedTo: ["all"] });
  const [showPrizeForm, setShowPrizeForm] = useState(false);

  useEffect(() => {
    (async () => {
      const [tSnap, pSnap] = await Promise.all([
        getDocs(collection(db, "tasks")),
        getDocs(collection(db, "rewards"))
      ]);
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPrizes(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  const startTaskEdit = task => {
    setEditingTaskId(task.id);
    setTaskData({ name: task.name, points: task.points, assignedTo: task.assignedTo || ["all"] });
    setShowTaskForm(false);
  };
  const saveTaskEdit = async () => {
    await updateDoc(doc(db, "tasks", editingTaskId), taskData);
    setTasks(ts => ts.map(t => t.id === editingTaskId ? { ...t, ...taskData } : t));
    setEditingTaskId(null);
  };
  const cancelTaskEdit = () => setEditingTaskId(null);
  const deleteTask = async id => {
    if (!window.confirm("Task wirklich löschen?")) return;
    await deleteDoc(doc(db, "tasks", id));
    setTasks(ts => ts.filter(t => t.id !== id));
    setEditingTaskId(null);
  };

  const startPrizeEdit = prize => {
    setEditingPrizeId(prize.id);
    setPrizeData({ name: prize.name, cost: prize.cost, assignedTo: prize.assignedTo || ["all"] });
    setShowPrizeForm(false);
  };
  const savePrizeEdit = async () => {
    await updateDoc(doc(db, "rewards", editingPrizeId), prizeData);
    setPrizes(ps => ps.map(p => p.id === editingPrizeId ? { ...p, ...prizeData } : p));
    setEditingPrizeId(null);
  };
  const cancelPrizeEdit = () => setEditingPrizeId(null);
  const deletePrize = async id => {
    if (!window.confirm("Prämie wirklich löschen?")) return;
    await deleteDoc(doc(db, "rewards", id));
    setPrizes(ps => ps.filter(p => p.id !== id));
    setEditingPrizeId(null);
  };
  const addPrize = async () => {
    if (!prizeData.name) return;
    const ref = await addDoc(collection(db, "rewards"), prizeData);
    setPrizes(ps => [...ps, { id: ref.id, ...prizeData }]);
    setPrizeData({ name: "", cost: 0, assignedTo: ["all"] });
    setShowPrizeForm(false);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <button onClick={onCloseAdmin}>Schließen</button>
        <button onClick={onReset}>Alle zurücksetzen</button>
        <button onClick={onResetPrizes}>Prämien zurücksetzen</button>
        <button onClick={() => { setShowTaskForm(f => !f); setEditingTaskId(null); setShowPrizeForm(false); }}>
          {showTaskForm ? "Form schließen" : "Neue Aufgabe hinzufügen"}
        </button>
      </div>

      <div className="admin-content">
        {showTaskForm && (
          <div className="admin-form">
            <TaskForm users={users} onSaved={() => setShowTaskForm(false)} />
          </div>
        )}

        {/* Tasks Table */}
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Punkte</th>
                <th>Zugeordnet an</th>
                <th className="action-cell">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => editingTaskId === task.id
                ? (
                  <tr key={task.id}>
                    <td>
                      <input
                        value={taskData.name}
                        onChange={e => setTaskData(d => ({ ...d, name: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={taskData.points}
                        onChange={e => setTaskData(d => ({ ...d, points: Number(e.target.value) }))}
                      />
                    </td>
                    <td>
                      <select
                        multiple
                        value={taskData.assignedTo}
                        onChange={e => {
                          const vals = Array.from(e.target.selectedOptions, o => o.value);
                          setTaskData(d => ({ ...d, assignedTo: vals }));
                        }}
                        size={Math.min(users.length + 1, 6)}
                      >
                        <option value="all">all</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </td>
                    <td className="action-cell">
                      <button className="icon-btn" onClick={saveTaskEdit} title="Speichern">✔</button>
                      <button className="icon-btn" onClick={cancelTaskEdit} title="Abbrechen">✖</button>
                      <button className="icon-btn delete-btn" onClick={() => deleteTask(task.id)} title="Löschen">🗑</button>
                    </td>
                  </tr>
                )
                : (
                  <tr key={task.id}>
                    <td>{task.name}</td>
                    <td>{task.points}</td>
                    <td>
                      <div className="assignees-stack">
                        {(task.assignedTo.includes("all") ? users : users.filter(u => task.assignedTo.includes(u.id)))
                          .map((u, idx) => (
                            <img
                              key={u.id}
                              src={`/profiles/${u.name.toLowerCase().replace(/\s+/g, "")}.jpg`}
                              alt={u.name}
                              className="assignee-avatar small"
                              style={{ borderColor: assigneeColors[u.id] || "transparent", zIndex: users.length - idx }}
                            />
                          ))}
                      </div>
                    </td>
                    <td className="action-cell">
                      <button className="icon-btn" onClick={() => startTaskEdit(task)} title="Bearbeiten">⚙</button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-header">
          <button onClick={() => { setShowPrizeForm(f => !f); setEditingTaskId(null); setShowTaskForm(false); }}>
            {showPrizeForm ? "Prämien-Form schließen" : "Neue Prämie hinzufügen"}
          </button>
        </div>

        {showPrizeForm && (
          <div className="admin-form">
            <label>
              Name
              <input
                value={prizeData.name}
                        onChange={e => setPrizeData(d => ({ ...d, name: e.target.value }))}
              />
            </label>
            <label>
              Punkte (Kosten)
              <input
                type="number"
                value={prizeData.cost}
                onChange={e => setPrizeData(d => ({ ...d, cost: Number(e.target.value) }))}
              />
            </label>
            <label>
              Zugeordnet an
              <select
                multiple
                value={prizeData.assignedTo}
                onChange={e => {
                  const vals = Array.from(e.target.selectedOptions, o => o.value);
                  setPrizeData(d => ({ ...d, assignedTo: vals }));
                }}
                size={Math.min(users.length + 1, 6)}
              >
                <option value="all">all</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
            <div>
              <button onClick={addPrize}>Anlegen</button>
            </div>
          </div>
        )}

        {/* Prizes Table */}
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Punkte</th>
                <th>Zugeordnet an</th>
                <th className="action-cell">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map(prize => editingPrizeId === prize.id
                ? (
                  <tr key={prize.id}>
                    <td>
                      <input
                        value={prizeData.name}
                        onChange={e => setPrizeData(d => ({ ...d, name: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={prizeData.cost}
                        onChange={e => setPrizeData(d => ({ ...d, cost: Number(e.target.value) }))}
                      />
                    </td>
                    <td>
                      <select
                        multiple
                        value={prizeData.assignedTo}
                        onChange={e => {
                          const vals = Array.from(e.target.selectedOptions, o => o.value);
                          setPrizeData(d => ({ ...d, assignedTo: vals }));
                        }}
                        size={Math.min(users.length + 1, 6)}
                      >
                        <option value="all">all</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </td>
                    <td className="action-cell">
                      <button className="icon-btn" onClick={savePrizeEdit} title="Speichern">✔</button>
                      <button className="icon-btn" onClick={cancelPrizeEdit} title="Abbrechen">✖</button>
                      <button className="icon-btn delete-btn" onClick={() => deletePrize(prize.id)} title="Löschen">🗑</button>
                    </td>
                  </tr>
                )
                : (
                  <tr key={prize.id}>
                    <td>{prize.name}</td>
                    <td>{prize.cost}</td>
                    <td>
                      <div className="assignees-stack">
                        {(prize.assignedTo.includes("all") ? users : users.filter(u => prize.assignedTo.includes(u.id)))
                          .map((u, idx) => (
                            <img
                              key={u.id}
                              src={`/profiles/${u.name.toLowerCase().replace(/\s+/g, "")}.jpg`}
                              alt={u.name}
                              className="assignee-avatar small"
                              style={{ borderColor: assigneeColors[u.id] || "transparent", zIndex: users.length - idx }}
                            />
                          ))}
                      </div>
                    </td>
                    <td className="action-cell">
                      <button className="icon-btn" onClick={() => startPrizeEdit(prize)} title="Bearbeiten">⚙</button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
