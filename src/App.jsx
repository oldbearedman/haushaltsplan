// src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";
import getIcon      from "./utils/getIcon";
import UserList     from "./UserList";
import useUsers     from "./hooks/useUsers";
import useTasks     from "./hooks/useTasks";
import useLevel     from "./hooks/useLevel";
import { collection, getDocs, updateDoc, doc, increment } from "firebase/firestore";
import { db }       from "./firebase";
import confetti     from "canvas-confetti";

import Header       from "./components/Header";
import Stats        from "./components/Stats";
import TabBar       from "./components/TabBar";
import TaskList     from "./components/TaskList";
import DoneList     from "./components/DoneList";
import PinModal     from "./components/PinModal";
import AdminPanel   from "./components/AdminPanel";
import TaskForm     from "./components/TaskForm";

export default function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLevelUp,  setShowLevelUp]  = useState(false);
  const [prevLevel,    setPrevLevel]    = useState(0);
  const [adminMode,    setAdminMode]    = useState(false);
  const [pinOpen,      setPinOpen]      = useState(false);
  const [pinInput,     setPinInput]     = useState("");
  const [view,         setView]         = useState("tasks");
  const [points,       setPoints]       = useState(0);

  const users = useUsers();
  // useTasks erwartet jetzt die aktuelle userId
  const { tasks, loading, error } = useTasks(selectedUser?.id);
  const { level, levelName, xpProgress, xpToNext, addXp, setXp } = useLevel(0);

  // Beim User-Wechsel Punkte/XP laden & Admin-Modus resetten
  useEffect(() => {
    setAdminMode(false);
    if (!selectedUser) return;
    (async () => {
      const snap  = await getDocs(collection(db, "users"));
      const meDoc = snap.docs.find(d => d.id === selectedUser.id);
      const me    = meDoc?.data() || {};
      setPoints(me.points || 0);
      setXp(me.xp || 0);
    })();
  }, [selectedUser, setXp]);

  // Level-Up Popup + Konfetti
  useEffect(() => {
    if (prevLevel > 0 && level > prevLevel) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 } });
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setPrevLevel(level);
  }, [level, prevLevel]);

  // Voll-Reset (Admin)
  const handleResetAll = async () => {
    if (!window.confirm("Alles zurücksetzen?")) return;
    const [tSnap, uSnap] = await Promise.all([
      getDocs(collection(db, "tasks")),
      getDocs(collection(db, "users"))
    ]);
    await Promise.all(tSnap.docs.map(d =>
      updateDoc(doc(db, "tasks", d.id), {
        doneBy: "", count: 0,
        availableFrom: "", lastResetDate: ""
      })
    ));
    await Promise.all(uSnap.docs.map(d =>
      updateDoc(doc(db, "users", d.id), { points: 0, xp: 0 })
    ));
    window.location.reload();
  };

  // Aufgabe abschließen / zurücksetzen
  const handleComplete = async (task, mode = "toggle") => {
    if (!selectedUser) return;
    const tRef  = doc(db, "tasks", task.id);
    const uRef  = doc(db, "users", selectedUser.id);
    let delta   = 0;
    const multi = typeof task.repeatInterval === "number";

    if (mode === "remove") {
      await updateDoc(tRef, {
        doneBy: "", lastDoneAt: "",
        count: multi ? 0 : undefined,
        availableFrom: ""
      });
      delta = -task.points * (multi ? (task.targetCount || 1) : 1);
    }
    else if (multi) {
      const newCount     = (task.count || 0) + 1;
      const done         = newCount >= task.targetCount;
      if (done) delta    = task.points;
      const nextAvailable = done
        ? new Date(Date.now() + task.repeatInterval * 86400000)
            .toISOString()
            .slice(0, 10)
        : "";
      await updateDoc(tRef, {
        count: newCount,
        doneBy: done ? selectedUser.name : "",
        doneById: done ? selectedUser.id : "",
        lastDoneAt: done ? new Date().toISOString().slice(0,10) : "",
        availableFrom: nextAvailable
      });
    }
    else {
      if (!task.doneBy) {
        delta = task.points;
        await updateDoc(tRef, {
          doneBy: selectedUser.name,
          doneById: selectedUser.id,
          lastDoneAt: new Date().toISOString().slice(0,10)
        });
      }
    }

    if (delta) {
      await updateDoc(uRef, { points: increment(delta), xp: increment(delta) });
      setPoints(p => p + delta);
      addXp(delta);
    }
  };

  // PIN-Modal Eingabe
  const handlePinInput = digit => {
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      if (next === "9627") setAdminMode(true);
      else alert("Falscher PIN!");
      setPinOpen(false);
      setPinInput("");
    }
  };

  // Header Back-Button
  const handleBack = () => {
    if (view === "rewards") setView("tasks");
    else setSelectedUser(null);
  };

  return (
    <div className="app-wrapper">
      {/* Level-Up Popup */}
      {showLevelUp && (
        <div className="level-up-popup">
          <div>🎉 Level {level} erreicht! 🎉</div>
          <div>🎉 {levelName} 🎉</div>
        </div>
      )}

      {/* Header */}
      <Header
        selectedUser={selectedUser}
        onBack={handleBack}
        onOpenAdmin={() => { setPinOpen(true); setPinInput(""); }}
      />

      {/* Stats */}
      {selectedUser && (
        <Stats
          level={level}
          levelName={levelName}
          xpProgress={xpProgress}
          xpToNext={xpToNext}
          points={points}
          onRedeemTab={() => setView("rewards")}
        />
      )}

      {/* TabBar */}
      {selectedUser && !adminMode && (
        <TabBar view={view} setView={setView} />
      )}

      {/* Main Content */}
      <main className="content">
        {!selectedUser ? (
          <UserList onUserSelect={setSelectedUser} />
        ) : loading ? (
          <div>Lade Aufgaben…</div>
        ) : error ? (
          <div>Fehler: {error.message}</div>
        ) : adminMode ? (
          <>
            <AdminPanel
              users={users}
              onReset={handleResetAll}
              onCloseAdmin={() => setAdminMode(false)}
            />
            <TaskForm users={users} />
          </>
        ) : view === "tasks" ? (
          <TaskList
            tasks={tasks}
            currentUserId={selectedUser.id}
            users={users}
            onComplete={handleComplete}
          />
                  ) : view==="done" ? (
                      <DoneList
                        tasks={tasks}
                        currentUserId={selectedUser.id}
                        onUndo={t => handleComplete(t, "remove")}
                      />
        ) : null}
      </main>

      {/* PIN-Modal */}
      {pinOpen && (
        <PinModal
          currentPinLength={pinInput.length}
          onInput={handlePinInput}
          onClose={() => { setPinOpen(false); setPinInput(""); }}
        />
      )}
    </div>
  );
}
