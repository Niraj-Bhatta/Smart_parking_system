import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const setSandboxMode = (val) => {
  localStorage.setItem("kalki_sandbox", val ? "true" : "false");
  window.dispatchEvent(new Event("kalki_sandbox_changed"));
};

// Sign in anonymously on app startup to comply with security rules
signInAnonymously(auth)
  .then(() => {
    console.log("Kalki App signed in anonymously to Firebase.");
    setSandboxMode(false);
  })
  .catch((error) => {
    console.error("Firebase Anonymous Auth failed:", error);
    setSandboxMode(true);
  });

export { app, db, auth };
