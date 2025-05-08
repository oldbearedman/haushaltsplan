// src/components/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";
import "./AdminPanel.css";
import "./TaskList.css";
import { assigneeColors } from "../utils/assigneeColors";

export default function AdminPanel({ users, onReset, onResetPrizes, onCloseAdmin }) {
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskData, setTaskData] = useState({
    name: "",
    points: "",
    targetCount: "",
    repeatInterval: "",
    assignedTo: ["all"]
  });
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [prizes, setPrizes] = useState([]);
  const [editingPrizeId, setEditingPrizeId] = useState(null);
  const [prizeData, setPrizeData] = useState({
    name: "",
    cost: "",
    assignedTo: ["all"]
  });
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

  const toggleTaskAssignee = id => {
    setTaskData(d => {
      let a = [...d.assignedTo];
      if (id === "all") {
        a = a.includes("all") ? [] : ["all"];
      } else {
        a = a.filter(x => x !== "all");
        a = a.includes(id) ? a.filter(x => x !== id) : [...a, id];
      }
      if (a.length === 0) a = ["all"];
      return { ...d, assignedTo: a };
    });
  };
  const togglePrizeAssignee = id => {
    setPrizeData(d => {
      let a = [...d.assignedTo];
      if (id === "all") {
        a = a.includes("all") ? [] : ["all"];
      } else {
        a = a.filter(x => x !== "all");
        a = a.includes(id) ? a.filter(x => x !== id) : [...a, id];
      }
      if (a.length === 0) a = ["all"];
      return { ...d, assignedTo: a };
    });
  };

  const startTaskEdit = task => {
    setEditingTaskId(task.id);
    setTaskData({
      name: task.name,
      points: task.points,
      targetCount: task.targetCount || "",
      repeatInterval: task.repeatInterval || "",
      assignedTo: task.assignedTo || ["all"]
    });
    setShowTaskForm(false);
  };
  const saveTaskEdit = async () => {
    await updateDoc(doc(db, "tasks", editingTaskId), {
      name: taskData.name,
      points: Number(taskData.points),
      targetCount: Number(taskData.targetCount),
      repeatInterval: Number(taskData.repeatInterval),
      assignedTo: taskData.assignedTo
    });
    setTasks(ts =>
      ts.map(t =>
        t.id === editingTaskId
          ? {
              ...t,
              name: taskData.name,
              points: Number(taskData.points),
              targetCount: Number(taskData.targetCount),
              repeatInterval: Number(taskData.repeatInterval),
              assignedTo: taskData.assignedTo
            }
          : t
      )
    );
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
    setPrizeData({
      name: prize.name,
      cost: prize.cost,
      assignedTo: prize.assignedTo || ["all"]
    });
    setShowPrizeForm(false);
  };
  const savePrizeEdit = async () => {
    await updateDoc(doc(db, "rewards", editingPrizeId), {
      name: prizeData.name,
      cost: Number(prizeData.cost),
      assignedTo: prizeData.assignedTo
    });
    setPrizes(ps =>
      ps.map(p =>
        p.id === editingPrizeId
          ? { ...p, name: prizeData.name, cost: Number(prizeData.cost), assignedTo: prizeData.assignedTo }
          : p
      )
    );
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
    const newPrize = {
      name: prizeData.name,
      cost: Number(prizeData.cost),
      assignedTo: prizeData.assignedTo
    };
    const ref = await addDoc(collection(db, "rewards"), newPrize);
    setPrizes(ps => [...ps, { id: ref.id, ...newPrize }]);
    setPrizeData({ name: "", cost: "", assignedTo: ["all"] });
    setShowPrizeForm(false);
  };

  const handleNewTaskSubmit = async e => {
    e.preventDefault();
    await addDoc(collection(db, "tasks"), {
      name: taskData.name,
      points: Number(taskData.points),
      targetCount: taskData.targetCount ? Number(taskData.targetCount) : null,
      repeatInterval: taskData.repeatInterval ? Number(taskData.repeatInterval) : null,
      assignedTo: taskData.assignedTo,
      doneBy: "",
      completions: [],
      lastDoneAt: "",
      availableFrom: ""
    });
    setTaskData({ name: "", points: "", targetCount: "", repeatInterval: "", assignedTo: ["all"] });
    setShowTaskForm(false);
    const snap = await getDocs(collection(db, "tasks"));
    setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <button onClick={onCloseAdmin}>Schließen</button>
        <button onClick={onReset}>Alle zurücksetzen</button>
        <button onClick={onResetPrizes}>Prämien zurücksetzen</button>
        <button
          onClick={() => {
            setShowTaskForm(f => !f);
            setEditingTaskId(null);
            setShowPrizeForm(false);
          }}
        >
          {showTaskForm ? "Form schließen" : "Neue Aufgabe hinzufügen"}
        </button>
      </div>

      <div className="admin-content">
        {showTaskForm && (
          <form className="admin-form" onSubmit={handleNewTaskSubmit}>
            <label>
              Aufgabenname
              <input
                type="text"
                value={taskData.name}
                onChange={e => setTaskData(d => ({ ...d, name: e.target.value }))}
              />
            </label>
            <label>
              Punkte
              <input
                type="number"
                value={taskData.points}
                onChange={e => setTaskData(d => ({ ...d, points: e.target.value }))}
              />
            </label>
            <label>
              Wie oft pro Tag
              <input
                type="number"
                value={taskData.targetCount}
                onChange={e => setTaskData(d => ({ ...d, targetCount: e.target.value }))}
              />
            </label>
            <label>
              Intervall (Tage)
              <input
                type="number"
                value={taskData.repeatInterval}
                onChange={e => setTaskData(d => ({ ...d, repeatInterval: e.target.value }))}
              />
            </label>
            <fieldset className="checkbox-group">
              <legend>Zugeordnet an</legend>
              <label>
                <input
                  type="checkbox"
                  checked={taskData.assignedTo.includes("all")}
                  onChange={() => toggleTaskAssignee("all")}
                /> Alle
              </label>
              {users.map(u => (
                <label key={u.id}>
                  <input
                    type="checkbox"
                    checked={taskData.assignedTo.includes(u.id)}
                    onChange={() => toggleTaskAssignee(u.id)}
                  /> {u.name}
                </label>
              ))}
            </fieldset>
            <button type="submit">Aufgabe anlegen</button>
          </form>
        )}

        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Punkte</th>
                <th>Pro Tag</th>
                <th>Intervall</th>
                <th>Zugeordnet an</th>
                <th className="action-cell">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task =>
                editingTaskId === task.id ? (
                  <React.Fragment key={task.id}>
                    <tr>
                      <td>
                        <label>
                          Name
                          <input
                            type="text"
                            value={taskData.name}
                            onChange={e => setTaskData(d => ({ ...d, name: e.target.value }))}
                          />
                        </label>
                      </td>
                      <td>
                        <label>
                          Punkte
                          <input
                            type="number"
                            value={taskData.points}
                            onChange={e => setTaskData(d => ({ ...d, points: e.target.value }))}
                          />
                        </label>
                      </td>
                      <td>
                        <label>
                          Pro Tag
                          <input
                            type="number"
                            value={taskData.targetCount}
                            onChange={e => setTaskData(d => ({ ...d, targetCount: e.target.value }))}
                          />
                        </label>
                      </td>
                      <td>
                        <label>
                          Intervall (Tage)
                          <input
                            type="number"
                            value={taskData.repeatInterval}
                            onChange={e => setTaskData(d => ({ ...d, repeatInterval: e.target.value }))}
                          />
                        </label>
                      </td>
                      <td></td>
                      <td className="action-cell">
                        <button className="icon-btn" onClick={saveTaskEdit}>✔</button>
                        <button className="icon-btn" onClick={cancelTaskEdit}>✖</button>
                        <button className="icon-btn delete-btn" onClick={() => deleteTask(task.id)}>🗑</button>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6}>
                        <fieldset className="checkbox-group">
                          <legend>Zugeordnet an</legend>
                          <label>
                            <input
                              type="checkbox"
                              checked={taskData.assignedTo.includes("all")}
                              onChange={() => toggleTaskAssignee("all")}
                            /> Alle
                          </label>
                          {users.map(u => (
                            <label key={u.id}>
                              <input
                                type="checkbox"
                                checked={taskData.assignedTo.includes(u.id)}
                                onChange={() => toggleTaskAssignee(u.id)}
                              /> {u.name}
                            </label>
                          ))}
                        </fieldset>
                      </td>
                    </tr>
                  </React.Fragment>
                ) : (
                  <tr key={task.id}>
                    <td>{task.name}</td>
                    <td>{task.points}</td>
                    <td>{task.targetCount || "-"}</td>
                    <td>{task.repeatInterval || "-"}</td>
                    <td>
                      <div className="assignees-stack">
                        {(task.assignedTo.includes("all") ? users : users.filter(u => task.assignedTo.includes(u.id))).map((u, idx) => (
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
                      <button className="icon-btn" onClick={() => startTaskEdit(task)}>⚙</button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-header">
          <button
            onClick={() => {
              setShowPrizeForm(f => !f);
              setEditingPrizeId(null);
              setShowTaskForm(false);
            }}
          >
            {showPrizeForm ? "Form schließen" : "Neue Prämie hinzufügen"}
          </button>
        </div>

        {showPrizeForm && (
          <form className="admin-form" onSubmit={e => { e.preventDefault(); addPrize(); }}>
            <label>
              Prämienname
              <input
                type="text"
                value={prizeData.name}
                onChange={e => setPrizeData(d => ({ ...d, name: e.target.value }))}
              />
            </label>
            <label>
              Kosten
              <input
                type="number"
                value={prizeData.cost}
                onChange={e => setPrizeData(d => ({ ...d, cost: e.target.value }))}
              />
            </label>
            <fieldset className="checkbox-group">
              <legend>Zugeordnet an</legend>
              <label>
                <input
                  type="checkbox"
                  checked={prizeData.assignedTo.includes("all")}
                  onChange={() => togglePrizeAssignee("all")}
                /> Alle
              </label>
              {users.map(u => (
                <label key={u.id}>
                  <input
                    type="checkbox"
                    checked={prizeData.assignedTo.includes(u.id)}
                    onChange={() => togglePrizeAssignee(u.id)}
                  /> {u.name}
                </label>
              ))}
            </fieldset>
            <button type="submit">Prämie anlegen</button>
          </form>
        )}

        <div className="admin-table-wrapper">
          <table>
            {/*…Prämien-Tabelle analog zu oben…*/}
          </table>
        </div>
      </div>
    </div>
);
}
