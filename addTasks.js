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

const tasks = [
  { name: "Staubsaugen", points: 45, doneBy: "" },
  { name: "Wischen", points: 35, doneBy: "" },
  { name: "Müll rausbringen", points: 5, doneBy: "" },
  { name: "Bad putzen", points: 40, doneBy: "" },
  { name: "Küche gründlich reinigen", points: 45, doneBy: "" },
  { name: "Fenster putzen", points: 64, doneBy: "" },
  { name: "Tisch decken & abräumen", points: 10, doneBy: "" },
  { name: "Spülmaschine ausräumen", points: 8, doneBy: "" },
  { name: "Wäsche aufhängen", points: 15, doneBy: "" },
  { name: "Wäsche zusammenlegen", points: 20, doneBy: "" },
  { name: "Zimmer aufräumen", points: 25, doneBy: "" },
];

async function addTasks() {
  for (const task of tasks) {
    await addDoc(collection(db, "tasks"), task);
    console.log(`Aufgabe hinzugefügt: ${task.name}`);
  }
}

addTasks();
