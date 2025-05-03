// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxyVbyVnPQS6w5vET9Bkvgg3Q8YfslZp0",
  authDomain: "haushaltsplan-c221d.firebaseapp.com",
  projectId: "haushaltsplan-c221d",
  storageBucket: "haushaltsplan-c221d.appspot.com",
  messagingSenderId: "1071820329561",
  appId: "1:1071820329561:web:b8bfa41cca960433081748",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
