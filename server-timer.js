import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

// 1. Load environment variables from .env file
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

console.log("Initializing Firebase with URL:", firebaseConfig.databaseURL);

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// 3. Sign in anonymously to access protected paths
console.log("Authenticating anonymously...");
signInAnonymously(auth)
  .then(() => {
    console.log("Connected and authenticated to Firebase successfully!");
    startMonitoring();
  })
  .catch((err) => {
    console.warn("Firebase Authentication failed. Attempting to start daemon without explicit auth (assuming rules might be public):", err.message);
    startMonitoring();
  });

function startMonitoring() {
  const slotsRef = ref(db, "smartParking/slots");
  const bookingsRef = ref(db, "smartParking/bookings");
  const liveRef = ref(db, "smartParking/live");

  let slotsDbData = {};
  let bookingsDbData = {};
  let liveData = null;

  const checkStateTransitions = async () => {
    if (!liveData || !slotsDbData) return;

    const now = Date.now();

    for (const [slotId, slot] of Object.entries(slotsDbData)) {
      const status = slot.status;
      const reservationId = slot.reservationId;
      const reservedBy = slot.reservedBy;

      // Determine physical occupancy of this slot based on live data
      const irVal = liveData.slots?.[slotId] === true;
      const distVal = liveData.distancesCm?.[`slot${slotId}`];

      let isPhysicallyOccupied = false;
      const SLOT_OCCUPIED_THRESHOLD_CM = 30;

      if (distVal !== undefined) {
        const ultrasonicOccupied = distVal < SLOT_OCCUPIED_THRESHOLD_CM;
        isPhysicallyOccupied = ultrasonicOccupied || irVal;
      } else {
        isPhysicallyOccupied = irVal;
      }

      // State Transitions
      if (status === "Reserved") {
        // If sensor detects vehicle within the window -> Occupied
        if (isPhysicallyOccupied) {
          console.log(`[VERIFICATION] Vehicle detected in Reserved slot ${slotId}. Transitioning to Occupied.`);
          const updates = {};
          updates[`smartParking/slots/${slotId}/status`] = "Occupied";
          updates[`smartParking/slots/${slotId}/occupied`] = true;
          updates[`smartParking/slots/${slotId}/lastUpdated`] = now;
          if (reservationId) {
            updates[`smartParking/bookings/${reservationId}/status`] = "confirmed";
            updates[`smartParking/bookings/${reservationId}/lastConfirmedAt`] = now;
          }
          await update(ref(db), updates);
        } else if (reservationId && bookingsDbData[reservationId]) {
          // If no vehicle detected, check if deadline has expired
          const booking = bookingsDbData[reservationId];
          const deadline = booking.arrivalDeadline;
          if (now > deadline) {
            console.log(`[EXPIRATION] 15-minute reservation window expired for slot ${slotId}. Reverting to Vacant.`);
            const updates = {};
            updates[`smartParking/slots/${slotId}/status`] = "Vacant";
            updates[`smartParking/slots/${slotId}/occupied`] = false;
            updates[`smartParking/slots/${slotId}/reservedBy`] = null;
            updates[`smartParking/slots/${slotId}/reservationId`] = null;
            updates[`smartParking/slots/${slotId}/lastUpdated`] = now;
            updates[`smartParking/bookings/${reservationId}/status`] = "expired";
            if (reservedBy) {
              updates[`smartParking/users/${reservedBy}/activeBookingId`] = null;
            }
            await update(ref(db), updates);
          }
        }
      } else if (status === "Occupied") {
        // If the sensor no longer detects a vehicle -> Vacant
        if (!isPhysicallyOccupied) {
          console.log(`[VACATED] Slot ${slotId} is no longer occupied. Reverting to Vacant.`);
          const updates = {};
          updates[`smartParking/slots/${slotId}/status`] = "Vacant";
          updates[`smartParking/slots/${slotId}/occupied`] = false;
          updates[`smartParking/slots/${slotId}/reservedBy`] = null;
          updates[`smartParking/slots/${slotId}/reservationId`] = null;
          updates[`smartParking/slots/${slotId}/lastUpdated`] = now;
          await update(ref(db), updates);
        }
      } else if (status === "Vacant" || status === "available") {
        // If the sensor detects a vehicle -> Occupied (spontaneous arrival)
        if (isPhysicallyOccupied) {
          console.log(`[SPONTANEOUS] Vehicle detected in Vacant slot ${slotId}. Transitioning to Occupied.`);
          const updates = {};
          updates[`smartParking/slots/${slotId}/status`] = "Occupied";
          updates[`smartParking/slots/${slotId}/occupied`] = true;
          updates[`smartParking/slots/${slotId}/lastUpdated`] = now;
          await update(ref(db), updates);
        }
      }
    }
  };

  // Listen to live sensors
  onValue(liveRef, (snap) => {
    liveData = snap.val() || {};
    checkStateTransitions();
  });

  // Listen to bookings
  onValue(bookingsRef, (snap) => {
    bookingsDbData = snap.val() || {};
  });

  // Listen to slots and execute daemon checks
  onValue(slotsRef, async (snap) => {
    slotsDbData = snap.val() || {};
    checkStateTransitions();
  });

  // Interval check (every 5 seconds) to ensure expirations are processed even if slots data doesn't change
  setInterval(async () => {
    const now = Date.now();
    for (const [slotId, slot] of Object.entries(slotsDbData)) {
      if (slot.status === "Reserved" && slot.reservationId) {
        const booking = bookingsDbData[slot.reservationId];
        if (booking) {
          // Check 1: Overall 15-minute arrival deadline
          const overallDeadlineExpired = now > booking.arrivalDeadline;

          // Check 2: 5-minute safety confirmation window (expires 5 minutes after nextConfirmationDue)
          const safetyDeadline = booking.nextConfirmationDue + 5 * 60 * 1000;
          const confirmationExpired = now > safetyDeadline;

          if (overallDeadlineExpired || confirmationExpired) {
            console.log(`[TIMEOUT-DAEMON] Expired booking detected for slot ${slotId} on interval (Overall: ${overallDeadlineExpired}, Confirm: ${confirmationExpired}). Reverting to Vacant.`);
            const updates = {};
            updates[`smartParking/slots/${slotId}/status`] = "Vacant";
            updates[`smartParking/slots/${slotId}/occupied`] = false;
            updates[`smartParking/slots/${slotId}/reservedBy`] = null;
            updates[`smartParking/slots/${slotId}/reservationId`] = null;
            updates[`smartParking/slots/${slotId}/lastUpdated`] = now;
            updates[`smartParking/bookings/${slot.reservationId}/status`] = "expired";
            if (slot.reservedBy) {
              updates[`smartParking/users/${slot.reservedBy}/activeBookingId`] = null;
            }
            await update(ref(db), updates);
          }
        }
      }
    }
  }, 5000);
}
