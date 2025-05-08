// src/hooks/useTasks.js
import { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db as firestoreDb } from "../firebase";
import { idbPut } from "../db";

const daysSince = isoDateStr => {
  if (!isoDateStr) return Infinity;
  const past = new Date(isoDateStr);
  return Math.floor((Date.now() - past) / (1000 * 60 * 60 * 24));
};

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const runResets = async fresh => {
    await Promise.all(
      fresh.map(async t => {
        const ri = t.repeatInterval;
        if (!ri) return;

        const completions = Array.isArray(t.completions) ? t.completions : [];
        const lastDate = t.targetCount > 1
          ? (completions.map(c => c.date).sort().pop() || "")
          : t.lastDoneAt || "";

        if (!lastDate) return;

        const passed = daysSince(lastDate);
        console.log(`[DEBUG] Task ${t.id} ri=${ri} last=${lastDate} passed=${passed}`);
        if (passed >= ri) {
          console.log(`[DEBUG] → Resetting ${t.id}`);

          t.lastDoneAt = "";
          if (t.targetCount > 1) t.completions = [];
          else t.doneBy = "";

          const updates = { lastDoneAt: "" };
          if (t.targetCount > 1) updates.completions = [];
          else updates.doneBy = "";

          try {
            await updateDoc(doc(firestoreDb, "tasks", t.id), updates);
          } catch (e) {
            console.warn(`Firestore reset error ${t.id}:`, e);
          }
        }
      })
    );
  };

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onSnapshot(
      collection(firestoreDb, "tasks"),
      async snapshot => {
        if (!isMounted) return;
        setLoading(true);

        let fresh = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        await runResets(fresh);

        setTasks(fresh);
        setLoading(false);

        fresh.forEach(task => idbPut("tasks", task));
      },
      err => {
        if (!isMounted) return;
        console.error("useTasks Firestore error:", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0
    );
    const msUntilMidnight = nextMidnight - now;

    const timer = setTimeout(async () => {
      console.log("[DEBUG] 00:00 Reset Trigger");
      const snap = await getDocs(collection(firestoreDb, "tasks"));
      const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      await runResets(fresh);
      setTasks(fresh);
    }, msUntilMidnight + 1000);

    return () => clearTimeout(timer);
  }, []);

  return { tasks, loading, error };
}
