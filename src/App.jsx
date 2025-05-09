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
import NetworkIndicator from "./components/NetworkIndicator";

export default function App() {
  // 1. Banner-State
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // 2. Dein User-State
  const [selectedUser, setSelectedUser] = useState(null);

  // Weiterer State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false);
  const [redeemedPrizes, setRedeemedPrizes] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [view, setView] = useState("tasks");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinMode, setPinMode] = useState("");
  const [loginPendingUser, setLoginPendingUser] = useState(null);
  const [lastResetTime, setLastResetTime] = useState(null);
  

  

  // Punkte/XP
  const [points, setPoints] = useState(0);

  // Hooks & Refs
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

  // Service-Worker–Update-Listener
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newSW = registration.installing;
          newSW.addEventListener("statechange", () => {
            if (
              newSW.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setShowUpdateBanner(true);
            }
          });
        });
      });
    }
  }, []);

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
  useEffect(() => {
  const today = new Date().toISOString().slice(0, 10);
  const lastReset = localStorage.getItem("lastResetDate");

  if (lastReset !== today) {
    (async () => {
      console.log("[DEBUG] → Nachträglicher Tagesreset");
      const snap = await getDocs(collection(db, "tasks"));
      const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      for (const task of fresh) {
        const ri = task.repeatInterval;
        if (!ri) continue;

        const completions = Array.isArray(task.completions) ? task.completions : [];
        const lastDate = task.targetCount > 1
          ? (completions.map(c => c.date).sort().pop() || "")
          : task.lastDoneAt || "";

        if (!lastDate) continue;
        const passed = Math.floor((Date.now() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (passed >= ri) {
          const updates = { lastDoneAt: "" };
          if (task.targetCount > 1) updates.completions = [];
          else updates.doneBy = "";

          try {
            await updateDoc(doc(db, "tasks", task.id), updates);
          } catch (e) {
            console.warn("Reset-Fehler bei", task.id, e);
          }
        }
      }

      localStorage.setItem("lastResetDate", today);
      localStorage.setItem("lastResetTime", Date.now());
      window.location.reload(); // UI aktualisieren
    })();
  }
}, []);
useEffect(() => {
  const storedTime = localStorage.getItem("lastResetTime");
  if (storedTime) setLastResetTime(parseInt(storedTime));
}, []);



// Admin: Nur Tasks zurücksetzen (XP/Points der User bleiben erhalten)
  const handleResetAll = async () => {
    if (!window.confirm("Alle Aufgaben zurücksetzen?")) return;
    const tSnap = await getDocs(collection(db, "tasks"));
    await Promise.all(
      tSnap.docs.map(d =>
        updateDoc(doc(db, "tasks", d.id), {
          doneBy: "",
          completions: [],
          // je nach Schema ggf. auch:
          lastDoneAt: "",
          availableFrom: ""
        })
      )
    );
    // Seite neu laden, damit UI sich aktualisiert
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
        await updateDoc(tRef, {
          doneBy: selectedUser.name,
          doneById: selectedUser.id,
          lastDoneAt: new Date().toISOString().slice(0, 10)
        });
        delta = pts;
      }
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

 const handlePinInput = (digit) => {
   if (digit === null) {
     // Backspace
     setPinInput((prev) => prev.slice(0, -1));
     return;
   }
   // Neue Ziffer, zuschneiden auf 4 Stellen
   setPinInput((prev) => (prev + digit).slice(0, 4));
 };
useEffect(() => {
  if (pinInput.length !== 4) return;

  // Wenn wir hier sind, ist pinInput genau 4 Zeichen lang
  if (pinMode === "admin") {
    if (pinInput === "9627") {
      setAdminMode(true);
    } else {
      alert("Falscher PIN!");
    }
  } else if (pinMode === "login" && loginPendingUser) {
    const lname = loginPendingUser.name.toLowerCase();
    const expected =
      lname.includes("taylor")
        ? "1507"
        : lname.includes("olivia")
        ? "1212"
        : lname.includes("brandon")
        ? "9627"
        : null;

    if (pinInput === expected) {
      setSelectedUser(loginPendingUser);
    } else {
      alert("Falscher PIN!");
    }
  }

  // Aufräumen
  setPinOpen(false);
  setPinInput("");
  setPinMode("");
  setLoginPendingUser(null);
}, [pinInput]);


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
      <NetworkIndicator />
      {/* Update-Banner bei neuer SW */}
    {showUpdateBanner && (
      <div className="update-banner">
        Neue Version verfügbar!{" "}
        <button onClick={() => window.location.reload()}>
          Neu laden
        </button>
      </div>
    )}
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
