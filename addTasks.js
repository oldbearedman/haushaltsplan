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

const today = new Date().toISOString().split("T")[0];

const tasks = [
  { name: "Spülmaschine einräumen", points: 6 },
  { name: "Geschirrspüler ausräumen", points: 6 },
  { name: "Wäsche waschen", points: 10 },
  { name: "Zimmer aufräumen", points: 10 },
  { name: "Wohnung saugen", points: 20 },
  { name: "Wohnung wischen", points: 25 },
  { name: "Badezimmer putzen", points: 30 },
  { name: "Bett beziehen", points: 15 },
  { name: "Tisch decken & abdecken", points: 5, targetCount: 3, count: 0 },
  { name: "Wäsche im Schrank verteilen", points: 5, targetCount: 3, count: 0 },
  { name: "Fenster putzen", points: 45, repeatInterval: 14 },
  { name: "Kühlschrank auswischen", points: 20, repeatInterval: 30 },
  { name: "Müll rausbringen", points: 5 },
  { name: "Einkäufe einräumen", points: 8 },
  { name: "Katzenklo reinigen", points: 10, repeatInterval: 3 },
  { name: "Oberflächen abwischen", points: 12 },
];

async function addTasks() {
  for (const task of tasks) {
    const taskWithMeta = {
      ...task,
      doneBy: "",
      lastResetDate: today,
    };
    await addDoc(collection(db, "tasks"), taskWithMeta);
    console.log(`Aufgabe hinzugefügt: ${task.name}`);
  }
}

addTasks();
