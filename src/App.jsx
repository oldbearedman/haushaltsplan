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

const levelThresholds = Array.from({ length: 99 }, (_, i) => 40 + i * 15);

const levelNames = [
  "Looser", "Knecht", "Putzlehrling", "Chaoskind", "Staubfänger",
  "Putzmuffel", "Schluri", "Unordnungsfan", "Lappenlutscher", "Sockenstreuer",
  "Kleiner Held", "Fleißbienchen", "Ordnungsschüler", "Putzazubi", "Klarblicker",
  "Wischlehrer", "Halbprofi", "Streitvermeider", "Routineheld", "Putzprofi",
  "Saugmeister", "Bodenbezwinger", "Flächenglätter", "Waschzauberer", "Kühlschrankdompteur",
  "Besenritter", "Putzdrache", "Bademeister", "Spülmaschinenheld", "Dreckvernichter",
  "Ordnungshüter", "Aufräumkapitän", "Küchenzauberer", "Schmutzmagier", "Wäschechampion",
  "Hygienewächter", "Putzgeneral", "Haushaltsmanager", "Glanzminister", "Wunderwischer",
  "Drecksdompteur", "Spülkrieger", "Alltagsheld", "Putzchampion", "Haushaltsheld",
  "Sauberkeitsguru", "Supermutti", "Hausvater", "Ordnungsboss", "Wunderwesen",
  "Sauberkeitskaiser", "Meister Proper", "Staubkönig", "Putztitan", "Hygienegott",
  "Supersorter", "Familienchef", "Gott des Haushalts", "Haushaltslegende", "Unaufhaltbar",
  "Putzmaschine", "Der Unerreichbare", "Der Perfekte", "Legende", "Halbgott der Ordnung",
  "Putzphänomen", "Der Endgegner", "Hüter des Haushalts", "Übermensch", "Maximalreiniger",
  "Glanzgott", "Finaler Boss", "Der Erhabene", "Der Unermüdliche", "Haushaltsorakel",
  "Heiliger Wischer", "Staubvernichter", "Sankt Ordnung", "Absolute Macht",
  ...Array(21).fill("Ultimativer Saubermann")
];

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

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const needsReset = allTasks.some((task) => {
        const isRepeat = !!task.repeatInterval;
        const isDone = !!task.doneBy;

        if (isRepeat && isDone && task.availableFrom && todayStr >= task.availableFrom) {
          return true;
        }

        if (!isRepeat && task.lastResetDate !== todayStr) {
          return true;
        }

        return false;
      });

      if (needsReset) {
        const batch = allTasks.map((task) => {
          const isRepeat = !!task.repeatInterval;
          const isDone = !!task.doneBy;

          if (isRepeat) {
            if (isDone && task.availableFrom && todayStr >= task.availableFrom) {
              const updates = { doneBy: "", lastResetDate: todayStr };
              return updateDoc(doc(db, "tasks", task.id), updates).then(() => ({
                ...task,
                ...updates
              }));
            }
            return Promise.resolve(task);
          }

          if (task.lastResetDate !== todayStr) {
            const updates = { doneBy: "", lastResetDate: todayStr };
            return updateDoc(doc(db, "tasks", task.id), updates).then(() => ({
              ...task,
              ...updates
            }));
          }

          return Promise.resolve(task);
        });

        const updatedTasks = await Promise.all(batch);
        setTasks(updatedTasks);
      } else {
        setTasks(allTasks);
      }

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
    let xpChange = 0;

    if (typeof task.targetCount === "number") {
      let count = task.count || 0;
      let progressByUser = { ...(task.progressByUser || {}) };
      let userProgress = progressByUser[selectedUser.name] || 0;


      if (mode === "add" && count < task.targetCount) {
        count++;
        userProgress++;
        pointChange = task.points || 1;
        progressByUser[selectedUser.name] = userProgress;
      } else if (mode === "remove" && userProgress > 0) {
        count--;
        userProgress--;
        pointChange = -(task.points || 1);
        if (userProgress === 0) {
          delete progressByUser[selectedUser.name];
        } else {
          progressByUser[selectedUser.name] = userProgress;
        }
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
      });
      

    } else {
      const wasDone = !!task.doneBy;
      const isOwn = task.doneBy === selectedUser.name;

      if (wasDone && isOwn) {
        updatedTask.doneBy = "";
        pointChange = -(task.points || 1);
      } else if (!wasDone) {
        updatedTask.doneBy = selectedUser.name;
        updatedTask.lastDoneAt = new Date().toISOString().split("T")[0];
                pointChange = task.points || 1;
      }

      const updateFields = {
        doneBy: updatedTask.doneBy,
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

    // Beschwerde löschen, wenn Aufgabe neu erledigt oder zurückgesetzt wird
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
    setComplaints(prev => ({
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
  
    // Punkte und XP beim ursprünglichen Nutzer abziehen
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
    const isOwn = task.doneBy === selectedUser.name;
    const isOther = task.doneBy && task.doneBy !== selectedUser.name;
    const complaint = complaints[task.id];
    const hasComplained = complaint?.users?.includes(selectedUser.name);
    const canApprove =
      complaint &&
      !hasComplained &&
      complaint.users.length === 1 &&
      selectedUser.name !== task.doneBy;
  
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
  
        {isOwn && (
          <button
            className="done-button grey"
            onClick={() => handleComplete(task, "remove")}
          >
            Rückgängig
          </button>
        )}
  
        {isOther && !complaint && (
          <button
            className="done-button red"
            style={{ fontSize: "1.4em", backgroundColor: "transparent", color: "red" }}
            onClick={() => handleComplaint(task.id)}
          >
            🚨
          </button>
        )}
  
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
  
        {canApprove && (
          <button
            className="done-button red"
            onClick={() => approveComplaint(task)}
          >
            Zustimmung
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
      .filter((task) => {
        const isMulti = typeof task.targetCount === "number";
        const current = task.count || 0;
        const target = task.targetCount || 1;
        const isDone = isMulti ? current >= target : !!task.doneBy;
        const today = new Date().toISOString().split("T")[0];
        return isDone && task.lastDoneAt === today;
      })
      .sort((a, b) => (b.lastDoneAt || "").localeCompare(a.lastDoneAt || ""))
      .map((task) => renderDoneTask(task))
    }

    <div className="section-divider"></div>
    <div className="section-title">Früher erledigt</div>
    {tasks
      .filter((task) => {
        const isMulti = typeof task.targetCount === "number";
        const current = task.count || 0;
        const target = task.targetCount || 1;
        const isDone = isMulti ? current >= target : !!task.doneBy;
        const today = new Date().toISOString().split("T")[0];
        return isDone && task.lastDoneAt && task.lastDoneAt < today;
      })
      .sort((a, b) => (b.lastDoneAt || "").localeCompare(a.lastDoneAt || ""))
      .map((task) => (
        <div className="task done older" key={task.id}>
          {renderDoneTask(task)}
        </div>
      ))
    }
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