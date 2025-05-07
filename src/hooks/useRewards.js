// src/hooks/useRewards.js
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function useRewards() {
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "rewards"),
      snap => {
        setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => {
        console.error("useRewards error:", err);
      }
    );
    return unsub;
  }, []);

  return { rewards };
}
