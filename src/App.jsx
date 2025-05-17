// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import useRewards from "./hooks/useRewards";
import "./App.css";
import UserList from "./UserList";
import useUsers from "./hooks/useUsers";
import useTasks from "./hooks/useTasks";
import useLevel from "./hooks/useLevel";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  increment
} from "firebase/firestore";
import { db } from "./firebase";
import confetti from "canvas-confetti";

import Header from "./components/Header";
import Stats from "./components/Stats";
import TabBar from "./components/TabBar";
import TaskList from "./components/TaskList";
import DoneList from "./components/DoneList";
import RewardsList from "./components/RewardsList";
import AdminPanel from "./components/AdminPanel";
import PinModal from "./components/PinModal";
import Ranking from "./components/Ranking";

export default function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false);
  const [redeemedPrizes, setRedeemedPrizes] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [view, setView] = useState("tasks");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinMode, setPinMode] = useState("");
  const [loginPendingUser, setLoginPendingUser] = useState(null);

  const [points, setPoints] = useState(0);
  const users = useUsers();
  const { tasks, loading, error } = useTasks();
  const { rewards } = useRewards();
  const {
    level,
    levelName,
    xpProgress,
    xpToNext,
    addXp,
    setXp
  } = useLevel(0);
  const prevLevelRef = useRef(level);

  // Punkte/XP laden bei User-Wechsel
  useEffect(() => {
    setAdminMode(false);
    if (!selectedUser) return;
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      const meDoc = snap.docs.find(d => d.id === selectedUser.id);
      const me = meDoc?.data() || {};
      setPoints(me.points || 0);
      setXp(me.xp || 0);
      prevLevelRef.current = me.xp || 0;
    })();
  }, [selectedUser, setXp]);

  // Confetti bei Level-Up
  useEffect(() => {
    const prev = prevLevelRef.current;
    if (level > prev) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 } });
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    prevLevelRef.current = level;
  }, [level]);

  // Admin: Tasks & Users zurücksetzen
  const handleResetAll = async () => {
    if (!window.confirm("Alles zurücksetzen?")) return;
    const [tSnap, uSnap] = await Promise.all([
      getDocs(collection(db, "tasks")),
      getDocs(collection(db, "users"))
    ]);
    await Promise.all(
      tSnap.docs.map(d =>
        updateDoc(doc(db, "tasks", d.id), {
          doneBy: "",
          count: 0,
          availableFrom: "",
          lastResetDate: "",
          userProgress: {},
          completions: []
        })
      )
    );
    await Promise.all(
      uSnap.docs.map(d =>
        updateDoc(doc(db, "users", d.id), { points: 0, xp: 0 })
      )
    );
    window.location.reload();
  };

  // Admin: eingelöste Prämien zurücksetzen
  const handleResetPrizes = () => {
    if (!window.confirm("Alle eingelösten Prämien wirklich zurücksetzen?")) return;
    setRedeemedPrizes([]);
  };

  // Aufgabe abschließen / rückgängig
  const handleComplete = async (task, mode = "toggle", targetCompletion = null) => {
    if (!selectedUser) return;
    const tRef = doc(db, "tasks", task.id);
    const uRef = doc(db, "users", selectedUser.id);
    const pts = task.points || 0;
    let delta = 0;
    const completions = Array.isArray(task.completions) ? task.completions : [];
    const isMulti = !!task.targetCount;

    if (mode === "remove" && isMulti) {
      const updated = completions.filter(c => {
        if (!targetCompletion) return c.userId !== selectedUser.id;
        return !(c.userId === selectedUser.id && c.timestamp === targetCompletion.timestamp);
      });
      await updateDoc(tRef, { completions: updated });
      delta = -pts;
    } else if (isMulti) {
      const today = new Date().toISOString().slice(0, 10);
      const todayAll = completions.filter(c => c.date === today);
      if (todayAll.length >= task.targetCount) return;
      const newC = {
        userId: selectedUser.id,
        userName: selectedUser.name,
        timestamp: new Date().toISOString(),
        date: today,
        taskId: task.id
      };
      await updateDoc(tRef, { completions: [...completions, newC] });
      delta = pts;
    } else {
      if (mode === "remove") {
        await updateDoc(tRef, { doneBy: "", doneById: "", lastDoneAt: "" });
        delta = -pts;
} else if (!task.doneBy) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const update = {
    doneBy: selectedUser.name,
    doneById: selectedUser.id,
    lastDoneAt: todayStr
  };

  if (task.repeatInterval && task.repeatInterval > 0) {
    const next = new Date(today);
    next.setDate(next.getDate() + task.repeatInterval);
    update.availableFrom = next.toISOString().slice(0, 10);
  }

  await updateDoc(tRef, update);
  delta = pts;
}


    if (delta !== 0) {
      await updateDoc(uRef, {
        points: increment(delta),
        xp: increment(delta)
      });
      setPoints(p => p + delta);
      addXp(delta);
    }
  };

  // Prämie einlösen
  const handleRedeem = async prize => {
    if (!selectedUser || points < prize.cost) return;
    const uRef = doc(db, "users", selectedUser.id);
    await updateDoc(uRef, {
      points: increment(-prize.cost),
      xp: increment(-prize.cost)
    });
    setPoints(p => p - prize.cost);
    setShowRedeemSuccess(true);
    confetti({ particleCount: 100, spread: 50, origin: { y: 0.3 } });
    setTimeout(() => setShowRedeemSuccess(false), 3000);
    setView("done");
    setRedeemedPrizes(ps => [
      ...ps,
      {
        id: prize.id,
        name: prize.name,
        redeemedBy: selectedUser.name,
        redeemedById: selectedUser.id,
        redeemedAt: new Date().toISOString().slice(0, 10)
      }
    ]);
  };

  // Pin-Eingabe-Handler für Admin und Login
  const handlePinInput = digit => {
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      if (pinMode === "admin") {
        if (next === "9627") setAdminMode(true);
        else alert("Falscher PIN!");
      } else if (pinMode === "login" && loginPendingUser) {
        const name = loginPendingUser.name.toLowerCase();
        const expected = name.includes("taylor")
          ? "1507"
          : name.includes("olivia")
          ? "1212"
          : name.includes("brandon")
          ? "9627"
          : null;
        if (expected === next) {
          setSelectedUser(loginPendingUser);
        } else {
          alert("Falscher PIN!");
        }
      }
      setPinOpen(false);
      setPinInput("");
      setPinMode("");
      setLoginPendingUser(null);
    }
  };

  // User-Auswahl öffnet Login-Pin
  const handleUserSelect = user => {
    setLoginPendingUser(user);
    setPinMode("login");
    setPinInput("");
    setPinOpen(true);
  };

  // Header: Admin-Pin öffnen
  const openAdminPin = () => {
    setPinMode("admin");
    setPinInput("");
    setPinOpen(true);
  };

  // Back-Button
  const handleBack = () => {
    if (view === "rewards" || view === "rankings") {
      setView("tasks");
    } else {
      setSelectedUser(null);
    }
  };

  return (
    <div className="app-wrapper">
      {showLevelUp && (
        <div className="level-up-popup">
          <div>🎉 Level {level} erreicht! 🎉</div>
          <div>🎉 {levelName} 🎉</div>
        </div>
      )}
      {showRedeemSuccess && (
        <div className="level-up-popup" style={{ background: "#FFD700" }}>
          <div>🎉 Prämie eingelöst! 🎉</div>
        </div>
      )}

      <Header
        selectedUser={selectedUser}
        onBack={handleBack}
        onOpenAdmin={openAdminPin}
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
          <UserList onUserSelect={handleUserSelect} />
        ) : loading ? (
          <div>Lade Aufgaben…</div>
        ) : error ? (
          <div>Fehler: {error.message}</div>
        ) : adminMode ? (
          <AdminPanel
            users={users}
            onReset={handleResetAll}
            onResetPrizes={handleResetPrizes}
            onCloseAdmin={() => setAdminMode(false)}
          />
        ) : view === "tasks" ? (
                 <TaskList
         tasks={tasks}
         currentUserId={selectedUser.id}
         onComplete={handleComplete}
         onShowLeaderboard={() => setView("rankings")}
       />
        ) : view === "done" ? (
          <DoneList
            tasks={tasks}
            redeemedPrizes={redeemedPrizes}
            currentUserId={selectedUser.id}
            onUndo={(task, _, c) => handleComplete(task, "remove", c)}
          />
        ) : view === "rewards" ? (
          <RewardsList
            rewards={rewards}
            points={points}
            onRedeem={handleRedeem}
            currentUserId={selectedUser.id}
          />
        ) : view === "rankings" ? (
          <Ranking users={users} />
        ) : null}
      </main>

      {pinOpen && (
        <PinModal
          currentPinLength={pinInput.length}
          onInput={handlePinInput}
          onClose={() => {
            setPinOpen(false);
            setPinInput("");
            setPinMode("");
            setLoginPendingUser(null);
          }}
        />
      )}
    </div>
  );
}
