import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";

// Load env variables
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const config = {};
envContent.split("\n").forEach((line) => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith("#")) {
    const delimiterIndex = cleanLine.indexOf("=");
    if (delimiterIndex !== -1) {
      const key = cleanLine.substring(0, delimiterIndex).trim();
      const val = cleanLine.substring(delimiterIndex + 1).trim();
      config[key] = val;
    }
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: config.VITE_FIREBASE_DATABASE_URL,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const slot = process.argv[2] || "P1";
const occupy = process.argv[3] === "occupied";

console.log(`Setting slot ${slot} occupancy to: ${occupy ? "OCCUPIED" : "VACANT"}`);

const updates = {};
updates[`smartParking/live/slots/${slot}`] = occupy;
if (occupy) {
  updates[`smartParking/live/distancesCm/slot${slot}`] = 10; // occupied threshold is < 30cm
} else {
  updates[`smartParking/live/distancesCm/slot${slot}`] = 150; // vacant
}

update(ref(db), updates)
  .then(() => {
    console.log("Database updated successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Database update failed:", err);
    process.exit(1);
  });
