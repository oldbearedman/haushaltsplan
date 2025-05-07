// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import getIcon from "./utils/getIcon";
import UserList from "./UserList";
import useUsers from "./hooks/useUsers";
import useTasks from "./hooks/useTasks";
import useLevel from "./hooks/useLevel";
import { collection, getDocs, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "./firebase";
import confetti from "canvas-confetti";

import Header from "./components/Header";
import Stats from "./components/Stats";
import TabBar from "./components/TabBar";
import TaskList from "./components/TaskList";
import DoneList from "./components/DoneList";
import PinModal from "./components/PinModal";
import AdminPanel from "./components/AdminPanel";
import TaskForm from "./components/TaskForm";

export default function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [view, setView] = useState("tasks");
  const [points, setPoints] = useState(0);

  const users = useUsers();
  const { tasks, loading, error } = useTasks(selectedUser?.id);
  const { level, levelName, xpProgress, xpToNext, addXp, setXp } = useLevel(0);

  // Ref, um den vorherigen Level zu merken
  const prevLevelRef = useRef(level);

  // Beim User-Wechsel initial XP/Points setzen
  useEffect(() => {
    setAdminMode(false);
    if (!selectedUser) return;
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      const meDoc = snap.docs.find(d => d.id === selectedUser.id);
      const me = meDoc?.data() || {};
      setPoints(me.points || 0);
      setXp(me.xp || 0);
      prevLevelRef.current = me.xp != null ? me.xp : level;
    })();
  }, [selectedUser, setXp, level]);

  // Konfetti einmal pro Level-Aufstieg
  useEffect(() => {
    const prev = prevLevelRef.current;
    if (level > prev) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 } });
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    prevLevelRef.current = level;
  }, [level]);

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

  const handleComplete = async (task, mode = "toggle") => {
    if (!selectedUser) return;
    const tRef = doc(db, "tasks", task.id);
    const uRef = doc(db, "users", selectedUser.id);
    let delta = 0;
    const multi = typeof task.repeatInterval === "number";

    if (mode === "remove") {
      await updateDoc(tRef, {
        doneBy: "", lastDoneAt: "",
        count: multi ? 0 : undefined,
        availableFrom: ""
      });
      delta = -task.points * (multi ? (task.targetCount || 1) : 1);
    } else if (multi) {
      const newCount = (task.count || 0) + 1;
      const done = newCount >= task.targetCount;
      if (done) delta = task.points;
      const nextAvailable = done
        ? new Date(Date.now() + task.repeatInterval * 86400000)
            .toISOString().slice(0,10)
        : "";
      await updateDoc(tRef, {
        count: newCount,
        doneBy: done ? selectedUser.name : "",
        doneById: done ? selectedUser.id : "",
        lastDoneAt: done ? new Date().toISOString().slice(0,10) : "",
        availableFrom: nextAvailable
      });
    } else {
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

  const handleBack = () => {
    if (view === "rewards") setView("tasks");
    else setSelectedUser(null);
  };

  return (
    <div className="app-wrapper">
      {showLevelUp && (
        <div className="level-up-popup">
          <div>🎉 Level {level} erreicht! 🎉</div>
          <div>🎉 {levelName} 🎉</div>
        </div>
      )}

      <Header
        selectedUser={selectedUser}
        onBack={handleBack}
        onOpenAdmin={() => { setPinOpen(true); setPinInput(""); }}
      />

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

      {selectedUser && !adminMode && (
        <TabBar view={view} setView={setView} />
      )}

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
        ) : view === "done" ? (
          <DoneList
            tasks={tasks}
            currentUserId={selectedUser.id}
            onUndo={t => handleComplete(t, "remove")}
          />
        ) : null}
      </main>

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
