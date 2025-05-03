import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxyVbyVnPQS6w5vET9Bkvgg3Q8YfslZp0",
  authDomain: "haushaltsplan-c221d.firebaseapp.com",
  projectId: "haushaltsplan-c221d",
  storageBucket: "haushaltsplan-c221d.appspot.com",
  messagingSenderId: "1071820329561",
  appId: "1:1071820329561:web:b8bfa41cca960433081748",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rewards = [
  { name: "5 Minuten Pause", cost: 20 },
  { name: "10 Minuten Bildschirmzeit", cost: 40 },
  { name: "1 Stunde zocken", cost: 100 },
  { name: "1 Kugel Eis", cost: 60 },
  { name: "Süßigkeit nach Wahl", cost: 50 },
  { name: "Filmabend aussuchen", cost: 150 },
  { name: "1 Tag keine Aufgaben", cost: 300 },
  { name: "Lieblingsessen wünschen", cost: 200 },
  { name: "30 Minuten Tablet/Handy", cost: 80 },
  { name: "Mit Mama/Papa allein raus", cost: 120 },
  { name: "3 € Taschengeld extra", cost: 180 },
  { name: "Brettspielabend", cost: 130 },
  { name: "Schlafen auf dem Sofa", cost: 90 },
  { name: "Länger aufbleiben (30 min)", cost: 70 },
  { name: "Neues Hörspiel", cost: 160 }
];

async function addRewards() {
  for (const reward of rewards) {
    await addDoc(collection(db, "rewards"), reward);
    console.log(`Prämie hinzugefügt: ${reward.name}`);
  }
}

addRewards();
