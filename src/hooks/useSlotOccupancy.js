import { useEffect, useState, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useLiveSensors } from "./useLiveSensors";

export const SLOT_OCCUPIED_THRESHOLD_CM = 30;

const defaultSlots = {
  P1: { status: "Vacant", occupied: false, reservedBy: null, reservationId: null },
  P2: { status: "Vacant", occupied: false, reservedBy: null, reservationId: null },
  P3: { status: "Vacant", occupied: false, reservedBy: null, reservationId: null },
  P4: { status: "Vacant", occupied: false, reservedBy: null, reservationId: null },
};

export function useSlotOccupancy() {
  const { liveData, loading: liveLoading } = useLiveSensors();
  const [slotsDbData, setSlotsDbData] = useState({});
  const [loading, setLoading] = useState(true);

  const [isSandbox, setIsSandbox] = useState(localStorage.getItem("kalki_sandbox") === "true");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Track Firebase authentication state to delay writes until ready
  useEffect(() => {
    if (isSandbox) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, [isSandbox]);

  useEffect(() => {
    const handleSandboxChange = () => {
      setIsSandbox(localStorage.getItem("kalki_sandbox") === "true");
    };
    window.addEventListener("kalki_sandbox_changed", handleSandboxChange);
    return () => window.removeEventListener("kalki_sandbox_changed", handleSandboxChange);
  }, []);

  const setSandboxMode = (val) => {
    localStorage.setItem("kalki_sandbox", val ? "true" : "false");
    window.dispatchEvent(new Event("kalki_sandbox_changed"));
  };

  // Subscribe to slots metadata (bookings, maintenance etc.)
  useEffect(() => {
    if (isSandbox) {
      const initLocalSlots = () => {
        const localSlotsStr = localStorage.getItem("kalki_local_slots");
        if (!localSlotsStr) {
          localStorage.setItem("kalki_local_slots", JSON.stringify(defaultSlots));
          setSlotsDbData(defaultSlots);
        } else {
          setSlotsDbData(JSON.parse(localSlotsStr));
        }
        setLoading(false);
      };
      initLocalSlots();

      const handleStorageChange = (e) => {
        if (e.key === "kalki_local_slots") {
          setSlotsDbData(JSON.parse(e.newValue || "{}"));
        }
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    } else {
      const slotsRef = ref(db, "smartParking/slots");
      const unsubscribe = onValue(
        slotsRef,
        (snap) => {
          setSlotsDbData(snap.val() || {});
          setLoading(false);
        },
        (err) => {
          console.error("Slots metadata listener error, falling back to local:", err);
          // Auto fallback if permission denied
          setSandboxMode(true);
          setSlotsDbData(defaultSlots);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [isSandbox]);

  // Central slot status writer
  const updateSlotStatus = useCallback(async (slotId, status, extra = {}) => {
    const activeSandbox = localStorage.getItem("kalki_sandbox") === "true";
    if (activeSandbox) {
      const localSlotsStr = localStorage.getItem("kalki_local_slots");
      const currentLocalSlots = localSlotsStr ? JSON.parse(localSlotsStr) : defaultSlots;
      currentLocalSlots[slotId] = {
        status,
        occupied: extra.occupied ?? false,
        reservedBy: extra.reservedBy ?? null,
        reservationId: extra.reservationId ?? null,
        lastUpdated: Date.now(),
      };
      localStorage.setItem("kalki_local_slots", JSON.stringify(currentLocalSlots));
      setSlotsDbData(currentLocalSlots);
      return;
    }

    try {
      const slotRef = ref(db, `smartParking/slots/${slotId}`);
      const updates = {
        status,
        occupied: extra.occupied ?? false,
        reservedBy: extra.reservedBy ?? null,
        reservationId: extra.reservationId ?? null,
        lastUpdated: Date.now(),
      };
      await update(slotRef, updates);
    } catch (err) {
      console.error(`Failed to update slot ${slotId}, switching to sandbox:`, err);
      setSandboxMode(true);
    }
  }, []);

  // Compute derived states for P1, P2, P3, P4
  const slots = ["P1", "P2", "P3", "P4"].map((slotId) => {
    const dbSlot = slotsDbData[slotId] || {
      status: "Vacant",
      occupied: false,
      reservedBy: null,
      reservationId: null,
    };

    const irVal = liveData?.slots?.[slotId] === true;
    const distVal = liveData?.distancesCm?.[`slot${slotId}`];

    let isPhysicallyOccupied = false;
    let hasConflict = false;
    let details = { ir: irVal, distance: distVal };

    if (distVal !== undefined) {
      const ultrasonicOccupied = distVal < SLOT_OCCUPIED_THRESHOLD_CM;
      const irOccupied = irVal;
      hasConflict = ultrasonicOccupied !== irOccupied;
      isPhysicallyOccupied = ultrasonicOccupied || irOccupied;
    } else {
      isPhysicallyOccupied = irVal;
      hasConflict = false;
    }

    // Combine with booking status to get final displayed status
    let derivedStatus = "Vacant";
    if (dbSlot.status === "maintenance") {
      derivedStatus = "maintenance";
    } else if (isPhysicallyOccupied) {
      derivedStatus = "Occupied";
    } else if (dbSlot.reservedBy && (dbSlot.status === "Reserved" || dbSlot.status === "Occupied")) {
      derivedStatus = "Reserved";
    } else {
      derivedStatus = "Vacant";
    }

    return {
      id: slotId,
      status: derivedStatus, // derived status
      dbStatus: dbSlot.status, // underlying status in db
      occupied: isPhysicallyOccupied,
      hasConflict,
      reservedBy: dbSlot.reservedBy,
      reservationId: dbSlot.reservationId,
      details,
    };
  });

  // Auto-sync derived states to Firebase slots node (or localStorage)
  useEffect(() => {
    if (loading || (!liveData && !isSandbox) || (!isSandbox && !isAuthenticated)) return;

    slots.forEach((slot) => {
      const dbSlot = slotsDbData[slot.id] || {};
      const statusDiffers = slot.status !== dbSlot.status;
      const occupancyDiffers = slot.occupied !== dbSlot.occupied;

      // Only allow syncing if the slot is vacant or reserved/occupied by ourselves
      const isAllowedToSync = !dbSlot.reservedBy || dbSlot.reservedBy === auth.currentUser?.uid;

      if (isAllowedToSync && (statusDiffers || occupancyDiffers)) {
        if (dbSlot.status === "maintenance" && !slot.occupied) {
          return;
        }

        updateSlotStatus(slot.id, slot.status, {
          occupied: slot.occupied,
          reservedBy: (slot.status === "Vacant" || slot.status === "maintenance") ? null : slot.reservedBy,
          reservationId: (slot.status === "Vacant" || slot.status === "maintenance") ? null : slot.reservationId,
        });
      }
    });
  }, [loading, liveData, slotsDbData, slots, updateSlotStatus, isSandbox, isAuthenticated]);

  return {
    slots,
    updateSlotStatus,
    loading: loading || (!liveData && !isSandbox),
  };
}
