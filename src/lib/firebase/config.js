// src/lib/firebase/config.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { browser } from '$app/environment';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB56MLjc5-NHLEEC7ZT1eMSxaRyiJV99-k",
  authDomain: "plot-twist-game.firebaseapp.com",
  databaseURL: "https://plot-twist-game-default-rtdb.firebaseio.com", // Added this line
  projectId: "plot-twist-game",
  storageBucket: "plot-twist-game.appspot.com",
  messagingSenderId: "998525398652",
  appId: "1:998525398652:web:ab763af390c93bc011e3f9",
  measurementId: "G-QNK1THZBQ7"
};

// Initialize Firebase only in the browser
let app;
let database;

if (browser) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  
  // Only initialize analytics in the browser if needed
  // const analytics = getAnalytics(app);
}

export { app, database };