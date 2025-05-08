// importPrizes.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "firebase/firestore";

// ─── 1) Deine Firebase-Konfiguration ───────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAxyVbyVnPQS6w5vET9Bkvgg3Q8YfslZp0",
  authDomain: "haushaltsplan-c221d.firebaseapp.com",
  projectId: "haushaltsplan-c221d",          // ← unbedingt korrekt!
  storageBucket: "haushaltsplan-c221d.appspot.com",
  messagingSenderId: "1071820329561",
  appId: "1:1071820329561:web:b8bfa41cca960433081748"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── 2) Prämien importieren ────────────────────────────────────────────────
async function importPrizes() {
  // 2a) Alle User laden
  const usersSnap = await getDocs(collection(db, "users"));
  const users = usersSnap.docs.map(d => ({
    id: d.id,
    name: (d.data().name || "").toLowerCase()
  }));

  // 2b) Olivia & Brandon heraussuchen
  const olivia  = users.find(u => u.name.includes("olivia"));
  const brandon = users.find(u => u.name.includes("brandon"));
  if (!olivia || !brandon) {
    console.error("❌ Olivia oder Brandon nicht gefunden. Prüfe genau die 'name'-Felder in Firestore!");
    return;
  }
  console.log("Olivia-ID:",  olivia.id);
  console.log("Brandon-ID:", brandon.id);

  // 2c) Prämien definieren
  const prizes = [
    // → Universal-Prämien (für alle)
    { name: "Tagesfilmabend",           cost: 100, assignedTo: ["all"] },
    { name: "Extra-TV-Zeit (+30 Min)",   cost:  70, assignedTo: ["all"] },
    { name: "Extra-TV-Zeit (+60 Min)",   cost: 140, assignedTo: ["all"] },
    { name: "Extra-Switch-Zeit (+30 Min)",cost:  75, assignedTo: ["all"] },
    { name: "Einen Tag keine Aufgaben",  cost: 150, assignedTo: ["all"] },
    { name: "Lieblingsessen wählen",     cost: 120, assignedTo: ["all"] },
    { name: "Eis-Ausflug",               cost:  80, assignedTo: ["all"] },
    { name: "Freistunde Hausarbeit",     cost: 150, assignedTo: ["all"] },
    { name: "Spielzeug-Mini",            cost: 200, assignedTo: ["all"] },
    { name: "Kinobesuch",                cost: 300, assignedTo: ["all"] },
    { name: "Wunschausflug",             cost: 500, assignedTo: ["all"] },

    // → Erwachsenen-Prämien (nur Olivia & Brandon)
    { name: "Candle-Light Dinner",       cost: 200, assignedTo: [olivia.id, brandon.id] },
    { name: "Entspannende Paarmassage",  cost: 300, assignedTo: [olivia.id, brandon.id] },
    { name: "Romantischer Filmabend",    cost: 120, assignedTo: [olivia.id, brandon.id] },
    { name: "Kuschelnacht ohne Ablenkung", cost:  80, assignedTo: [olivia.id, brandon.id] },
    { name: "Abendliches Rollenspiel-Date",cost: 200, assignedTo: [olivia.id, brandon.id] }
  ];

  // 2d) Prämien in Firestore speichern
  for (const prize of prizes) {
    await addDoc(collection(db, "rewards"), prize);
    console.log(`✅ Prämie hinzugefügt: ${prize.name} (${prize.assignedTo.join(",")})`);
  }
}

importPrizes().catch(console.error);
