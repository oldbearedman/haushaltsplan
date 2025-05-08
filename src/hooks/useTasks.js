// src/hooks/useTasks.js
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db as firestoreDb } from "../firebase";
import { dbPromise, idbGetAll, idbPut } from "../db";

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // 1) Lokale DB: Sofort Tasks laden (falls vorhanden)
    idbGetAll("tasks")
      .then(localTasks => {
        if (!isMounted) return;
        if (localTasks.length > 0) {
          setTasks(localTasks);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn("IndexedDB read error:", err);
      });

    // 2) Firestore: Echtzeit-Subscription
    const unsubscribe = onSnapshot(
      collection(firestoreDb, "tasks"),
      async snapshot => {
        if (!isMounted) return;
        const fresh = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(fresh);
        setLoading(false);

        // 3) In IndexedDB speichern
        try {
          const db = await dbPromise;
          const tx = db.transaction("tasks", "readwrite");
          fresh.forEach(task => tx.store.put(task));
          await tx.done;
        } catch (err) {
          console.warn("IndexedDB write error:", err);
        }
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

  return { tasks, loading, error };
}
