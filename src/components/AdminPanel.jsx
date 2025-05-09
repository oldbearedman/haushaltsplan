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

const CATEGORY_OPTIONS = [
  "Küche",
  "Wohnzimmer",
  "Wäsche",
  "Badezimmer",
  "Schlafzimmer",
  "Kinderzimmer",
  "Büro",
  "Flur",
  "Saugen",
  "Wischen",
  "Sonstiges"
];

export default function AdminPanel({ users, onReset, onResetPrizes, onCloseAdmin }) {
  // Tasks
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskData, setTaskData] = useState({
    name: "",
    points: "",
    targetCount: "",
    repeatInterval: "",
    assignedTo: ["all"],
    category: "Unkategorisiert"
  });
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Prizes
  const [prizes, setPrizes] = useState([]);
  const [editingPrizeId, setEditingPrizeId] = useState(null);
  const [prizeData, setPrizeData] = useState({
    name: "",
    cost: "",
    assignedTo: ["all"]
  });
  const [showPrizeForm, setShowPrizeForm] = useState(false);

  // Load initial data
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
// Aufgaben sortieren wie in TaskList
const CATEGORY_ORDER = [
  "Küche", "Wohnzimmer", "Wäsche", "Badezimmer", "Schlafzimmer",
  "Kinderzimmer", "Büro", "Flur", "Saugen", "Wischen", "Sonstiges"
];

const categoryOrderIndex = cat => CATEGORY_ORDER.indexOf(cat || "Küche");

const sortedTasks = [...tasks].sort((a, b) => {
  const catA = categoryOrderIndex(a.category);
  const catB = categoryOrderIndex(b.category);
  if (catA !== catB) return catA - catB;
  return a.name.localeCompare(b.name);
});

  // --- Task handlers ---
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

  const startTaskEdit = task => {
    setEditingTaskId(task.id);
    setTaskData({
      name: task.name,
      points: task.points,
      targetCount: task.targetCount || "",
      repeatInterval: task.repeatInterval || "",
      assignedTo: task.assignedTo || ["all"],
      category: task.category || "Unkategorisiert"
    });
    setShowTaskForm(false);
    setShowPrizeForm(false);
  };

  const saveTaskEdit = async () => {
    await updateDoc(doc(db, "tasks", editingTaskId), {
      name: taskData.name,
      points: Number(taskData.points),
      targetCount: Number(taskData.targetCount),
      repeatInterval: Number(taskData.repeatInterval),
      assignedTo: taskData.assignedTo,
      category: taskData.category
    });
    setTasks(ts =>
      ts.map(t =>
        t.id === editingTaskId
          ? { ...t, ...taskData, points: Number(taskData.points) }
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

  const handleNewTaskSubmit = async e => {
    e.preventDefault();
    const newTask = {
      name: taskData.name,
      points: Number(taskData.points),
      targetCount: taskData.targetCount ? Number(taskData.targetCount) : null,
      repeatInterval: taskData.repeatInterval ? Number(taskData.repeatInterval) : null,
      assignedTo: taskData.assignedTo,
      category: taskData.category,
      doneBy: "",
      completions: [],
      lastDoneAt: "",
      availableFrom: ""
    };
    const ref = await addDoc(collection(db, "tasks"), newTask);
    setTasks(ts => [...ts, { id: ref.id, ...newTask }]);
    setTaskData({
      name: "",
      points: "",
      targetCount: "",
      repeatInterval: "",
      assignedTo: ["all"],
      category: "Unkategorisiert"
    });
    setShowTaskForm(false);
  };

  // --- Prize handlers ---
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

  const startPrizeEdit = prize => {
    setEditingPrizeId(prize.id);
    setPrizeData({
      name: prize.name,
      cost: prize.cost,
      assignedTo: prize.assignedTo || ["all"]
    });
    setShowPrizeForm(false);
    setShowTaskForm(false);
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
          ? { ...p, ...prizeData, cost: Number(prizeData.cost) }
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

  return (
    <div className="admin-panel">
      {/* Header */}
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
        {/* Neue Aufgabe */}
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
            <label>
              Kategorie
              <select
                value={taskData.category}
                onChange={e => setTaskData(d => ({ ...d, category: e.target.value }))}
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="checkbox-group">
              <legend>Zugeordnet an</legend>
              <label>
                <input
                  type="checkbox"
                  checked={taskData.assignedTo.includes("all")}
                  onChange={() => toggleTaskAssignee("all")}
                />{" "}
                Alle
              </label>
              {users.map(u => (
                <label key={u.id}>
                  <input
                    type="checkbox"
                    checked={taskData.assignedTo.includes(u.id)}
                    onChange={() => toggleTaskAssignee(u.id)}
                  />{" "}
                  {u.name}
                </label>
              ))}
            </fieldset>
            <button type="submit">Aufgabe anlegen</button>
          </form>
        )}

        {/* Aufgaben-Liste */}
        {!showTaskForm && (
          <div className="admin-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Punkte</th>
                  <th>Pro Tag</th>
                  <th>Intervall</th>
                  <th>Kategorie</th>
                  <th>Zugeordnet an</th>
                  <th className="action-cell">Aktion</th>
                </tr>
              </thead>
<tbody>
  {CATEGORY_ORDER.map(category => {
    const tasksInCategory = sortedTasks.filter(t => (t.category || "Unkategorisiert") === category);
    if (tasksInCategory.length === 0) return null;

    return (
      <React.Fragment key={category}>
        <tr className="admin-category-header">
          <th colSpan={7}>{category}</th>
        </tr>
        {tasksInCategory.map(task => {
          if (editingTaskId === task.id) {
            return (
              <React.Fragment key={task.id}>
                <tr>
                  <td>
                    <input
                      type="text"
                      value={taskData.name}
                      onChange={e => setTaskData(d => ({ ...d, name: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={taskData.points}
                      onChange={e => setTaskData(d => ({ ...d, points: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={taskData.targetCount}
                      onChange={e => setTaskData(d => ({ ...d, targetCount: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={taskData.repeatInterval}
                      onChange={e => setTaskData(d => ({ ...d, repeatInterval: e.target.value }))}
                    />
                  </td>
                  <td>
                    <select
                      value={taskData.category}
                      onChange={e => setTaskData(d => ({ ...d, category: e.target.value }))}
                    >
                      {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td></td>
                  <td className="action-cell">
                    <button onClick={saveTaskEdit}>✔</button>
                    <button onClick={cancelTaskEdit}>✖</button>
                    <button onClick={() => deleteTask(task.id)}>🗑</button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={7}>
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
            );
          }

          return (
            <tr key={task.id}>
              <td>{task.name}</td>
              <td>{task.points}</td>
              <td>{task.targetCount || "-"}</td>
              <td>{task.repeatInterval || "-"}</td>
              <td>{task.category || "Unkategorisiert"}</td>
              <td>
                <div className="assignees-stack">
                  {(task.assignedTo.includes("all") ? users : users.filter(u => task.assignedTo.includes(u.id))).map((u, idx) => (
                    <img
                      key={u.id}
                      src={`/profiles/${u.name.toLowerCase().replace(/\s+/g, "")}.jpg`}
                      alt={u.name}
                      className="assignee-avatar small"
                      style={{
                        borderColor: assigneeColors[u.id] || "transparent",
                        zIndex: users.length - idx
                      }}
                    />
                  ))}
                </div>
              </td>
              <td className="action-cell">
                <button onClick={() => startTaskEdit(task)}>🔧</button>
              </td>
            </tr>
          );
        })}
      </React.Fragment>
    );
  })}
</tbody>


            </table>
          </div>
        )}

        {/* Prämien-Abschnitt */}
        <div className="admin-header">
          <button
            onClick={() => {
              setShowPrizeForm(f => !f);
              setEditingPrizeId(null);
              setShowTaskForm(false);
            }}
          >
            {showPrizeForm ? "Prämien-Form schließen" : "Neue Prämie hinzufügen"}
          </button>
        </div>
        {showPrizeForm && (
          <div className="admin-form">
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
                />{" "}
                Alle
              </label>
              {users.map(u => (
                <label key={u.id}>
                  <input
                    type="checkbox"
                    checked={prizeData.assignedTo.includes(u.id)}
                    onChange={() => togglePrizeAssignee(u.id)}
                  />{" "}
                  {u.name}
                </label>
              ))}
            </fieldset>
            <button onClick={addPrize}>Anlegen</button>
          </div>
        )}
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Kosten</th>
                <th>Zugeordnet an</th>
                <th className="action-cell">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map(prize =>
                editingPrizeId === prize.id ? (
                  <React.Fragment key={prize.id}>
                    <tr>
                      <td>
                        <input
                          type="text"
                          value={prizeData.name}
                          onChange={e => setPrizeData(d => ({ ...d, name: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={prizeData.cost}
                          onChange={e => setPrizeData(d => ({ ...d, cost: e.target.value }))}
                        />
                      </td>
                      <td></td>
                      <td className="action-cell">
                        <button onClick={savePrizeEdit} title="Speichern">✔</button>
                        <button onClick={cancelPrizeEdit} title="Abbrechen">✖</button>
                        <button onClick={() => deletePrize(prize.id)} title="Löschen">🗑</button>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4}>
                        <fieldset className="checkbox-group">
                          <legend>Zugeordnet an</legend>
                          <label>
                            <input
                              type="checkbox"
                              checked={prizeData.assignedTo.includes("all")}
                              onChange={() => togglePrizeAssignee("all")}
                            />{" "}
                            Alle
                          </label>
                          {users.map(u => (
                            <label key={u.id}>
                              <input
                                type="checkbox"
                                checked={prizeData.assignedTo.includes(u.id)}
                                onChange={() => togglePrizeAssignee(u.id)}
                              />{" "}
                              {u.name}
                            </label>
                          ))}
                        </fieldset>
                      </td>
                    </tr>
                  </React.Fragment>
                ) : (
                  <tr key={prize.id}>
                    <td>{prize.name}</td>
                    <td>{prize.cost}</td>
                    <td>
                      <div className="assignees-stack">
                        {(prize.assignedTo.includes("all") ? users : users.filter(u => prize.assignedTo.includes(u.id))).map((u, idx) => (
                          <img
                            key={u.id}
                            src={`/profiles/${u.name.toLowerCase().replace(/\s+/g, "")}.jpg`}
                            alt={u.name}
                            className="assignee-avatar small"
                            style={{
                              borderColor: assigneeColors[u.id] || "transparent",
                              zIndex: users.length - idx
                            }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="action-cell">
                      <button onClick={() => startPrizeEdit(prize)} title="Bearbeiten">🔧</button>
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