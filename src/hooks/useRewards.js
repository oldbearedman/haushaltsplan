import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function useRewards() {
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "rewards"));
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

  return { rewards };
}
