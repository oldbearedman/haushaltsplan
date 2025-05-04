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
import {
  FaBroom,
  FaUtensils,
  FaTshirt,
  FaGift,
  FaToilet,
  FaHandsWash,
} from "react-icons/fa";

// Level thresholds
const levelThresholds = Array.from({ length: 99 }, (_, i) => 40 + i * 15);
const levelNames = [
  "Looser", "Knecht", "Putzlehrling", "Chaoskind", "Staubfänger",
  // ... rest of your level names
];

// Get task icon
const getIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes("tisch")) return <FaUtensils />;
  if (lower.includes("wäsche")) return <FaTshirt />;
  if (lower.includes("boden")) return <FaBroom />;
  if (lower.includes("toilette") || lower.includes("bad")) return <FaToilet />;
  if (lower.includes("hände")) return <FaHandsWash />;
  return <FaBroom />;
};

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [xp, setXp] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [level, setLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0);
  const [xpToNext, setXpToNext] = useState(40);
  const [view, setView] = useState("tasks");
  const [complaints, setComplaints] = useState({});
  const [showComplaintBox, setShowComplaintBox] = useState(null);
  const [complaintText, setComplaintText] = useState("");

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

    if (lvl > level) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    setLevel(lvl);
    setXpToNext(required - prevRequired);
    setXpProgress(totalXP - prevRequired);
  };

  const handleReset = async () => {
    if (!window.confirm("Willst du wirklich alles zurücksetzen?")) return;

    const tasksSnap = await getDocs(collection(db, "tasks"));
    const usersSnap = await getDocs(collection(db, "users"));

    for (const taskDoc of tasksSnap.docs) {
      const taskRef = doc(db, "tasks", taskDoc.id);
      await updateDoc(taskRef, {
        doneBy: "",
        count: 0,
        availableFrom: "",
        lastResetDate: "2025-05-03",
        progressByUser: {},
        completions: [],
      });
    }

    for (const userDoc of usersSnap.docs) {
      const userRef = doc(db, "users", userDoc.id);
      await updateDoc(userRef, {
        points: 0,
        xp: 0,
      });
    }

    alert("Alle Aufgaben und Punkte wurden zurückgesetzt.");
    window.location.reload();
  };

  const handleComplete = async (task, mode = "toggle") => {
    if (!selectedUser) return;

    const taskRef = doc(db, "tasks", task.id);
    const userRef = doc(db, "users", selectedUser.id);

    let updatedTask = { ...task };
    let pointChange = 0;

    if (typeof task.targetCount === "number") {
      let count = task.count || 0;
      let progressByUser = { ...(task.progressByUser || {}) };
      let userProgress = progressByUser[selectedUser.name] || 0;
      let completions = [...(task.completions || [])];

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(":").slice(0, 2).join(":");

      if (mode === "add" && count < task.targetCount) {
        count++;
        userProgress++;
        pointChange = task.points || 1;
        progressByUser[selectedUser.name] = userProgress;
      } else if (mode === "remove" && userProgress > 0) {
        const lastIndex = completions
          .map((c, i) => ({ ...c, index: i }))
          .filter((c) => c.name === selectedUser.name)
          .map((c) => c.index)
          .pop();
        if (lastIndex !== undefined) {
          completions.splice(lastIndex, 1);
        }
        count--;
        userProgress--;
        pointChange = -(task.points || 1);
        if (userProgress === 0) {
          delete progressByUser[selectedUser.name];
        } else {
          progressByUser[selectedUser.name] = userProgress;
        }
      }

      if (mode === "add") {
        completions.push({
          name: selectedUser.name,
          date: dateStr,
          time: timeStr
        });
      }

      updatedTask.count = count;
      updatedTask.progressByUser = progressByUser;
      updatedTask.doneBy = count >= task.targetCount ? selectedUser.name : "";
      updatedTask.lastDoneAt = count >= task.targetCount ? new Date().toISOString().split("T")[0] : "";

      await updateDoc(taskRef, {
        count,
        doneBy: updatedTask.doneBy,
        lastDoneAt: updatedTask.lastDoneAt || "",
        progressByUser,
        completions,
      });
      updatedTask.completions = completions;

    } else {
      const wasDone = !!task.doneBy;
      const isOwn = task.doneBy === selectedUser.name;
      let completions = [...(task.completions || [])];

      if (wasDone && isOwn) {
        updatedTask.doneBy = "";
        pointChange = -(task.points || 1);
        const lastIndex = completions
          .map((c, i) => ({ ...c, index: i }))
          .filter((c) => c.name === selectedUser.name)
          .map((c) => c.index)
          .pop();
        if (lastIndex !== undefined) {
          completions.splice(lastIndex, 1);
        }
      } else if (!wasDone) {
        updatedTask.doneBy = selectedUser.name;
        updatedTask.lastDoneAt = new Date().toISOString().split("T")[0];
        pointChange = task.points || 1;
        const now = new Date();
        completions.push({
          name: selectedUser.name,
          date: now.toISOString().split("T")[0],
          time: now.toTimeString().split(":").slice(0, 2).join(":"),
        });
      }

      updatedTask.completions = completions;

      const updateFields = {
        doneBy: updatedTask.doneBy,
        completions,
      };

      if (updatedTask.lastDoneAt) {
        updateFields.lastDoneAt = updatedTask.lastDoneAt;
      }

      await updateDoc(taskRef, updateFields);
    }

    if (pointChange !== 0) {
      await updateDoc(userRef, {
        points: increment(pointChange),
        xp: increment(pointChange),
      });

      setPoints((prev) => prev + pointChange);
      const newXp = xp + pointChange;
      setXp(newXp);
      calculateLevel(newXp);
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...updatedTask } : t))
    );

    setComplaints((prev) => {
      const updated = { ...prev };
      delete updated[task.id];
      return updated;
    });
  };

  const handleComplaint = (taskId) => {
    setShowComplaintBox(taskId);
  };

  const submitComplaint = (taskId) => {
    if (!complaintText.trim()) return;
    setComplaints((prev) => ({
      ...prev,
      [taskId]: {
        text: complaintText,
        count: 1,
        users: [selectedUser.name],
      }
    }));
    setShowComplaintBox(null);
    setComplaintText("");
  };

  const approveComplaint = async (task) => {
    const updatedTask = { ...task, doneBy: "", count: 0, lastDoneAt: "" };
    const taskRef = doc(db, "tasks", task.id);

    await updateDoc(taskRef, {
      doneBy: "",
      count: 0,
      lastDoneAt: "",
    });

    const usersSnap = await getDocs(collection(db, "users"));
    const userDoc = usersSnap.docs.find((u) => u.data().name === task.doneBy);

    if (userDoc) {
      const userRef = doc(db, "users", userDoc.id);
      const pointsToRemove = -(task.points || 1);

      await updateDoc(userRef, {
        points: increment(pointsToRemove),
        xp: increment(pointsToRemove),
      });

      if (userDoc.id === selectedUser.id) {
        setPoints((prev) => prev + pointsToRemove);
        const newXp = xp + pointsToRemove;
        setXp(newXp);
        calculateLevel(newXp);
      }
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updatedTask : t))
    );

    const newComplaints = { ...complaints };
    delete newComplaints[task.id];
    setComplaints(newComplaints);
  };

  const renderDoneTask = (task) => {
    const isOwn = task.doneBy === selectedUser.name; // Prüft, ob der Benutzer die Aufgabe erledigt hat
    const isOther = task.doneBy && task.doneBy !== selectedUser.name; // Prüft, ob die Aufgabe von jemand anderem erledigt wurde
    const complaint = complaints[task.id]; // Holt die Beschwerde für die Aufgabe
    const hasComplained = complaint?.users?.includes(selectedUser.name); // Prüft, ob der Benutzer bereits eine Beschwerde abgegeben hat
    const canApprove = 
      complaint && 
      !hasComplained && 
      complaint.users.length === 1 && 
      selectedUser.name !== task.doneBy; // Prüft, ob der Benutzer der Beschwerde zustimmen kann
  
    return (
      <div key={task.id} className="task done">
        <div className="task-text">
          <div className="task-title">
            {getIcon(task.name)} &nbsp; {task.name}
            {complaint && (
              <span style={{ marginLeft: "8px", fontSize: "0.9em", color: "red" }}>
                {complaint.users.length}/2 🚨
              </span>
            )}
          </div>
          <div className="done-by">
            Erledigt von {task.doneBy || "?"} am {task.lastDoneAt || "?"}
          </div>
          {complaint && (
            <div style={{ color: "red", marginTop: "4px" }}>
              ⚠️ {complaint.text}
            </div>
          )}
        </div>
  
        {/* Beschwerdebutton nur anzeigen, wenn der aktuelle Nutzer die Aufgabe nicht erledigt hat */}
        {isOther && !complaint && (
          <button
            className="done-button red"
            style={{ fontSize: "1.4em", backgroundColor: "transparent", color: "red" }}
            onClick={() => handleComplaint(task.id)} // Zeigt das Textfeld für die Beschwerde an
          >
            🚨
          </button>
        )}
  
        {/* Textfeld für die Beschwerde anzeigen, wenn es aktiviert ist */}
        {showComplaintBox === task.id && (
          <div style={{ marginTop: "8px" }}>
            <input
              type="text"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Was stimmt nicht?"
              style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
            />
            <button
              className="done-button red"
              onClick={() => submitComplaint(task.id)}
            >
              Abschicken
            </button>
          </div>
        )}
  
        {/* Zustimmungsbutton für die Beschwerde */}
        {canApprove && (
          <button
            className="done-button red"
            onClick={() => approveComplaint(task)}
          >
            Zustimmung
          </button>
        )}
  
        {/* Rückgängig Button */}
        {isOwn && (
          <button
            className="done-button grey"
            onClick={() => handleComplete(task, "remove")}
          >
            Rückgängig
          </button>
        )}
      </div>
    );
  };
  
  

  return (
    <div className="app-wrapper">
      {showLevelUp && (
        <div className="level-up-popup">
          🎉 Level {level} erreicht – {levelNames[level - 1]}! 🎉
        </div>
      )}

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
        {selectedUser && (
          <button
            className="menu-button"
            onClick={() => {
              const action = prompt("Menü:\n1 = Reset (Entwicklerfunktion)");
              if (action === "1") handleReset();
              else alert("Menü kommt bald!");
            }}
          >
            ☰
          </button>
        )}
      </header>

      <div className="top-gap" />

      {selectedUser && (
        <>
          <div className="fixed-stats">
            <div className="level-display">
              <div className="level-info">Level {level} – {levelNames[level - 1]}</div>
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
            >
              🪙 {points}
            </div>
          </div>

          <div className="tab-bar">
            <button
              className={`tab-button ${view === "tasks" ? "active" : ""}`}
              onClick={() => setView("tasks")}
            >
              Aufgabenliste
            </button>
            <button
              className={`tab-button ${view === "done" ? "active" : ""}`}
              onClick={() => setView("done")}
            >
              Erledigt
            </button>
          </div>
        </>
      )}

      {!selectedUser ? (
        <UserList onUserSelect={setSelectedUser} />
      ) : view === "tasks" ? (
        <div className="task-list">
          <div className="section-title">Aufgabenliste</div>
          {tasks
            .filter((task) => {
              const isMulti = typeof task.targetCount === "number";
              const current = task.count || 0;
              const target = task.targetCount || 1;
              return isMulti ? current < target : !task.doneBy;
            })
            .sort((a, b) => {
              const doneA = !!a.doneBy || (a.count >= a.targetCount);
              const doneB = !!b.doneBy || (b.count >= b.targetCount);
              return doneA - doneB;
            })
            .map((task) => {
              const isMulti = typeof task.targetCount === "number";
              const current = task.count || 0;
              const target = task.targetCount || 3;
              const isDone = isMulti ? current >= target : !!task.doneBy;
              const canUndo = task.doneBy === selectedUser.name;
              const locked =
                task.repeatInterval &&
                task.doneBy &&
                task.availableFrom &&
                task.availableFrom > new Date().toISOString().split("T")[0];

              return (
                <div key={task.id} className={`task ${isDone ? "done" : "open"}`}>
                  <div className="task-text">
                    <div className={`task-title ${isDone ? "strikethrough" : ""}`}>
                      {getIcon(task.name)} &nbsp; {task.name}
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

                    {locked && (
                      <div className="done-by">Verfügbar ab: {task.availableFrom}</div>
                    )}

                    {isDone && !locked && (
                      <div className="done-by">Erledigt von {task.doneBy}</div>
                    )}
                  </div>

                  {!locked && isMulti && (!isDone || task.doneBy === selectedUser.name) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {!isDone && (
                        <button
                          className="done-button"
                          onClick={() => handleComplete(task, "add")}
                        >
                          🪙 +{task.points}
                        </button>
                      )}
                      {(task.progressByUser?.[selectedUser.name] || 0) > 0 && (
                        <button
                          className="done-button grey"
                          onClick={() => handleComplete(task, "remove")}
                        >
                          Rückgängig
                        </button>
                      )}
                    </div>
                  )}

                  {!locked && !isMulti && (!isDone || canUndo) && (
                    <button
                      className={`done-button ${isDone ? "grey" : ""}`}
                      onClick={() => handleComplete(task)}
                    >
                      {isDone ? "Rückgängig" : `🪙 +${task.points}`}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      ) : view === "done" ? (
        <div className="task-list">
          <div className="section-title">Heute erledigt</div>
          {tasks
            .filter((task) => (task.completions || []).length > 0)
            .flatMap((task) =>
              task.completions.map((entry, idx) => ({
                ...entry,
                taskName: task.name,
                taskId: task.id,
                key: `${task.id}-${entry.name}-${entry.date}-${entry.time}-${idx}`
              }))
            )
            .filter((entry) => entry.date === new Date().toISOString().split("T")[0])
            .map((entry) => (
              <div className="task done" key={entry.key}>
                <div className="task-text">
                  <div className="task-title">
                    {getIcon(entry.taskName)} &nbsp; {entry.taskName}
                  </div>
                  <div className="done-by">
                    Erledigt von {entry.name} um {entry.time}
                  </div>

                  {entry.name === selectedUser.name && (
                    <button
                      className="done-button grey"
                      onClick={() =>
                        handleComplete(tasks.find((t) => t.id === entry.taskId), "remove")
                      }
                    >
                      Rückgängig
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="task-list">
          <div className="section-title">Punkte einlösen</div>
          {rewards.map((reward) => (
            <div key={reward.id} className="task reward">
              <div className="task-text">
                <div className="task-title">
                  <FaGift style={{ marginRight: "6px" }} />
                  {reward.name} (-{reward.cost})
                </div>
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
