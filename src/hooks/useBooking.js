import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, update, push } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/config";

export function useBooking(currentUserId = null) {
  const [userId, setUserId] = useState(currentUserId || localStorage.getItem("kalki_userId"));
  const [userProfile, setUserProfile] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [timeToNextConfirm, setTimeToNextConfirm] = useState(0);
  const [timeToDeadline, setTimeToDeadline] = useState(0);
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [lastExpiredSlot, setLastExpiredSlot] = useState("");

  const [isSandbox, setIsSandbox] = useState(localStorage.getItem("kalki_sandbox") === "true");

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

  // Sync userId to state & localStorage
  useEffect(() => {
    if (isSandbox) {
      let storedId = localStorage.getItem("kalki_userId");
      if (!storedId || storedId.length === 28) {
        storedId = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("kalki_userId", storedId);
      }
      setUserId(storedId);
    } else {
      const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
        if (authUser) {
          localStorage.setItem("kalki_userId", authUser.uid);
          setUserId(authUser.uid);
        }
      });
      return () => unsubscribeAuth();
    }
  }, [isSandbox]);

  // Subscribe to user profile
  useEffect(() => {
    if (!userId) return;

    if (isSandbox) {
      const fetchLocalUser = () => {
        const usersStr = localStorage.getItem("kalki_local_users") || "{}";
        const users = JSON.parse(usersStr);
        setUserProfile(users[userId] || null);
      };
      fetchLocalUser();

      const handleStorage = (e) => {
        if (e.key === "kalki_local_users") {
          const users = JSON.parse(e.newValue || "{}");
          setUserProfile(users[userId] || null);
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    } else {
      const userRef = ref(db, `smartParking/users/${userId}`);
      const unsubscribe = onValue(userRef, (snap) => {
        setUserProfile(snap.val());
      });
      return () => unsubscribe();
    }
  }, [userId, isSandbox]);

  // Subscribe to active booking if present
  useEffect(() => {
    if (!userProfile?.activeBookingId) {
      setActiveBooking(null);
      setLoading(false);
      return;
    }

    if (isSandbox) {
      const fetchActiveBooking = () => {
        const bookingsStr = localStorage.getItem("kalki_local_bookings") || "{}";
        const bookings = JSON.parse(bookingsStr);
        const data = bookings[userProfile.activeBookingId];
        if (data) {
          setActiveBooking({ id: userProfile.activeBookingId, ...data });
        } else {
          setActiveBooking(null);
        }
        setLoading(false);
      };
      fetchActiveBooking();

      const handleStorage = (e) => {
        if (e.key === "kalki_local_bookings") {
          const bookings = JSON.parse(e.newValue || "{}");
          const data = bookings[userProfile.activeBookingId];
          if (data) {
            setActiveBooking({ id: userProfile.activeBookingId, ...data });
          } else {
            setActiveBooking(null);
          }
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    } else {
      const bookingRef = ref(db, `smartParking/bookings/${userProfile.activeBookingId}`);
      const unsubscribe = onValue(bookingRef, (snap) => {
        const data = snap.val();
        if (data) {
          setActiveBooking({ id: userProfile.activeBookingId, ...data });
        } else {
          setActiveBooking(null);
        }
        setLoading(false);
      }, (err) => {
        console.error("Active booking subscription error:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userProfile?.activeBookingId, isSandbox]);

  // Subscribe to all bookings (primarily for Admin Panel)
  useEffect(() => {
    if (isSandbox) {
      const fetchAllBookings = () => {
        const bookingsStr = localStorage.getItem("kalki_local_bookings") || "{}";
        const bookings = JSON.parse(bookingsStr);
        const list = Object.keys(bookings)
          .map((key) => ({
            id: key,
            ...bookings[key],
          }))
          .filter((b) => b.slotId && b.userId && b.status);
        setAllBookings(list.sort((a, b) => (b.bookedAt || 0) - (a.bookedAt || 0)));
      };
      fetchAllBookings();

      const handleStorage = (e) => {
        if (e.key === "kalki_local_bookings") {
          const bookings = JSON.parse(e.newValue || "{}");
          const list = Object.keys(bookings)
            .map((key) => ({
              id: key,
              ...bookings[key],
            }))
            .filter((b) => b.slotId && b.userId && b.status);
          setAllBookings(list.sort((a, b) => (b.bookedAt || 0) - (a.bookedAt || 0)));
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    } else {
      const bookingsRef = ref(db, "smartParking/bookings");
      const unsubscribe = onValue(bookingsRef, (snap) => {
        const data = snap.val() || {};
        const list = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((b) => b.slotId && b.userId && b.status);
        setAllBookings(list.sort((a, b) => (b.bookedAt || 0) - (a.bookedAt || 0)));
      });

      return () => unsubscribe();
    }
  }, [isSandbox]);

  // Detect background or offline booking expiration
  useEffect(() => {
    const lastBookingId = localStorage.getItem("kalki_last_booking_id");
    if (!lastBookingId || activeBooking) return;

    if (isSandbox) {
      const bookingsStr = localStorage.getItem("kalki_local_bookings") || "{}";
      const bookings = JSON.parse(bookingsStr);
      const booking = bookings[lastBookingId];
      if (booking) {
        if (booking.status === "expired") {
          setLastExpiredSlot(booking.slotId);
          setShowExpiredModal(true);
          localStorage.removeItem("kalki_last_booking_id");
        } else if (booking.status === "confirmed" || booking.status === "cancelled") {
          localStorage.removeItem("kalki_last_booking_id");
        }
      }
    } else {
      const bookingRef = ref(db, `smartParking/bookings/${lastBookingId}`);
      const unsubscribe = onValue(bookingRef, (snap) => {
        const booking = snap.val();
        if (booking) {
          if (booking.status === "expired") {
            setLastExpiredSlot(booking.slotId);
            setShowExpiredModal(true);
            localStorage.removeItem("kalki_last_booking_id");
          } else if (booking.status === "confirmed" || booking.status === "cancelled") {
            localStorage.removeItem("kalki_last_booking_id");
          }
        }
      });
      return () => unsubscribe();
    }
  }, [activeBooking, isSandbox]);

  // Helper trigger to notify local tab state changes
  const triggerStorageUpdate = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    // Manually trigger storage event for the current tab
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: JSON.stringify(value) }));
  };

  // Expiration action (can be triggered by driver or admin or auto-eval)
  const expireBooking = useCallback(async (bookingId, slotId, bUserId) => {
    const activeSandbox = localStorage.getItem("kalki_sandbox") === "true";
    if (activeSandbox) {
      // 1. Update Booking
      const bookingsStr = localStorage.getItem("kalki_local_bookings") || "{}";
      const bookings = JSON.parse(bookingsStr);
      if (bookings[bookingId]) {
        bookings[bookingId].status = "expired";
        triggerStorageUpdate("kalki_local_bookings", bookings);
      }

      // 2. Update Slot
      const slotsStr = localStorage.getItem("kalki_local_slots") || "{}";
      const slots = JSON.parse(slotsStr);
      if (slots[slotId]) {
        slots[slotId].status = "Vacant";
        slots[slotId].reservedBy = null;
        slots[slotId].reservationId = null;
        slots[slotId].lastUpdated = Date.now();
        triggerStorageUpdate("kalki_local_slots", slots);
      }

      // 3. Update User
      const usersStr = localStorage.getItem("kalki_local_users") || "{}";
      const users = JSON.parse(usersStr);
      if (users[bUserId]) {
        users[bUserId].activeBookingId = null;
        triggerStorageUpdate("kalki_local_users", users);
      }

      console.log(`[SANDBOX] Booking ${bookingId} expired & Slot ${slotId} released.`);
      return;
    }

    try {
      const updates = {};
      updates[`smartParking/bookings/${bookingId}/status`] = "expired";
      updates[`smartParking/slots/${slotId}/status`] = "Vacant";
      updates[`smartParking/slots/${slotId}/reservedBy`] = null;
      updates[`smartParking/slots/${slotId}/reservationId`] = null;
      updates[`smartParking/slots/${slotId}/lastUpdated`] = Date.now();
      updates[`smartParking/users/${bUserId}/activeBookingId`] = null;

      await update(ref(db), updates);
      console.log(`Booking ${bookingId} expired & Slot ${slotId} released.`);
    } catch (err) {
      console.error("Error expiring booking:", err);
    }
  }, []);

  // Booking Timer Logic
  useEffect(() => {
    if (!activeBooking || activeBooking.status === "expired" || activeBooking.status === "cancelled") {
      setShowConfirmPrompt(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      // Check overall arrival deadline
      const deadlineDiff = activeBooking.arrivalDeadline - now;
      setTimeToDeadline(Math.max(0, deadlineDiff));

      if (deadlineDiff <= 0) {
        clearInterval(interval);
        expireBooking(activeBooking.id, activeBooking.slotId, activeBooking.userId);
        return;
      }

      // Check next confirmation due time
      const nextDueDiff = activeBooking.nextConfirmationDue - now;
      
      const windowStart = activeBooking.nextConfirmationDue;
      const windowEnd = activeBooking.nextConfirmationDue + 5 * 60 * 1000;

      if (now >= windowStart && now < windowEnd) {
        setShowConfirmPrompt(true);
        setTimeToNextConfirm(Math.max(0, windowEnd - now));
      } else if (now >= windowEnd) {
        clearInterval(interval);
        setShowConfirmPrompt(false);
        expireBooking(activeBooking.id, activeBooking.slotId, activeBooking.userId);
      } else {
        setShowConfirmPrompt(false);
        setTimeToNextConfirm(Math.max(0, nextDueDiff));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBooking, expireBooking]);

  // Book a slot
  const bookSlot = useCallback(async (slotId, name, phone, email) => {
    const activeSandbox = localStorage.getItem("kalki_sandbox") === "true";
    const now = Date.now();
    const finalUserId = userId || `user_${Math.random().toString(36).substr(2, 9)}`;
    const newBookingId = `booking_${Math.random().toString(36).substr(2, 9)}`;

    if (activeSandbox) {
      // 1. Create/Update user profile
      const usersStr = localStorage.getItem("kalki_local_users") || "{}";
      const users = JSON.parse(usersStr);
      users[finalUserId] = {
        name,
        phone,
        email,
        activeBookingId: newBookingId
      };
      triggerStorageUpdate("kalki_local_users", users);

      // 2. Create booking payload
      const bookingsStr = localStorage.getItem("kalki_local_bookings") || "{}";
      const bookings = JSON.parse(bookingsStr);
      bookings[newBookingId] = {
        userId: finalUserId,
        slotId,
        bookedAt: now,
        arrivalDeadline: now + 15 * 60 * 1000,
        status: "pending_confirmation",
        lastConfirmedAt: null,
        nextConfirmationDue: now + 5 * 60 * 1000,
        missedConfirmations: 0,
      };
      triggerStorageUpdate("kalki_local_bookings", bookings);

      // 3. Update Slot
      const slotsStr = localStorage.getItem("kalki_local_slots") || "{}";
      const slots = JSON.parse(slotsStr);
      slots[slotId] = {
        status: "Reserved",
        occupied: false,
        reservedBy: finalUserId,
        reservationId: newBookingId,
        lastUpdated: now,
      };
      triggerStorageUpdate("kalki_local_slots", slots);

      setUserId(finalUserId);
      localStorage.setItem("kalki_last_booking_id", newBookingId);
      console.log(`[SANDBOX] Slot ${slotId} successfully booked. Booking ID: ${newBookingId}`);
      return newBookingId;
    }

    try {
      if (!userId) {
        localStorage.setItem("kalki_userId", finalUserId);
        setUserId(finalUserId);
      }

      // Register or update user profile
      const userRef = ref(db, `smartParking/users/${finalUserId}`);
      await set(userRef, {
        name,
        phone,
        email,
        activeBookingId: null
      });

      // Create new booking node
      const bookingsRef = ref(db, "smartParking/bookings");
      const newBookingRef = push(bookingsRef);
      const bookingId = newBookingRef.key;

      const bookedAt = now;
      const arrivalDeadline = now + 15 * 60 * 1000;
      const nextConfirmationDue = now + 5 * 60 * 1000;

      const bookingPayload = {
        userId: finalUserId,
        slotId,
        bookedAt,
        arrivalDeadline,
        status: "pending_confirmation",
        lastConfirmedAt: null,
        nextConfirmationDue,
        missedConfirmations: 0,
      };

      await set(newBookingRef, bookingPayload);

      const updates = {};
      updates[`smartParking/slots/${slotId}/status`] = "Reserved";
      updates[`smartParking/slots/${slotId}/reservedBy`] = finalUserId;
      updates[`smartParking/slots/${slotId}/reservationId`] = bookingId;
      updates[`smartParking/slots/${slotId}/lastUpdated`] = now;
      updates[`smartParking/users/${finalUserId}/activeBookingId`] = bookingId;

      await update(ref(db), updates);

      localStorage.setItem("kalki_last_booking_id", bookingId);
      console.log(`Slot ${slotId} successfully booked. Booking ID: ${bookingId}`);
      return bookingId;
    } catch (err) {
      console.error("Booking transaction failed, switching to Sandbox fallback:", err);
      setSandboxMode(true);
      // Retry in sandbox mode
      return bookSlot(slotId, name, phone, email);
    }
  }, [userId]);

  // Confirm booking (pulsing "Are you still coming?" button)
  const confirmBooking = useCallback(async () => {
    if (!activeBooking) return;
    const activeSandbox = localStorage.getItem("kalki_sandbox") === "true";
    const now = Date.now();

    if (activeSandbox) {
      const bookingsStr = localStorage.getItem("kalki_local_bookings") || "{}";
      const bookings = JSON.parse(bookingsStr);
      if (bookings[activeBooking.id]) {
        bookings[activeBooking.id].status = "confirmed";
        bookings[activeBooking.id].lastConfirmedAt = now;
        bookings[activeBooking.id].nextConfirmationDue = now + 5 * 60 * 1000;
        bookings[activeBooking.id].missedConfirmations = 0;
        triggerStorageUpdate("kalki_local_bookings", bookings);
      }
      setShowConfirmPrompt(false);
      console.log(`[SANDBOX] Booking ${activeBooking.id} confirmed.`);
      return;
    }

    try {
      const bookingRef = ref(db, `smartParking/bookings/${activeBooking.id}`);
      await update(bookingRef, {
        status: "confirmed",
        lastConfirmedAt: now,
        nextConfirmationDue: now + 5 * 60 * 1000,
        missedConfirmations: 0,
      });

      setShowConfirmPrompt(false);
      console.log(`Booking ${activeBooking.id} confirmed.`);
    } catch (err) {
      console.error("Confirmation write failed, switching to sandbox:", err);
      setSandboxMode(true);
    }
  }, [activeBooking]);

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId = null, slotId = null, bUserId = null) => {
    localStorage.removeItem("kalki_last_booking_id");
    const targetBookingId = bookingId || activeBooking?.id;
    const targetSlotId = slotId || activeBooking?.slotId;
    const targetUserId = bUserId || userId;

    if (!targetBookingId || !targetSlotId) return;

    const activeSandbox = localStorage.getItem("kalki_sandbox") === "true";
    if (activeSandbox) {
      // 1. Update booking
      const bookingsStr = localStorage.getItem("kalki_local_bookings") || "{}";
      const bookings = JSON.parse(bookingsStr);
      if (bookings[targetBookingId]) {
        bookings[targetBookingId].status = "cancelled";
        triggerStorageUpdate("kalki_local_bookings", bookings);
      }

      // 2. Update slot
      const slotsStr = localStorage.getItem("kalki_local_slots") || "{}";
      const slots = JSON.parse(slotsStr);
      if (slots[targetSlotId]) {
        slots[targetSlotId].status = "Vacant";
        slots[targetSlotId].reservedBy = null;
        slots[targetSlotId].reservationId = null;
        slots[targetSlotId].lastUpdated = Date.now();
        triggerStorageUpdate("kalki_local_slots", slots);
      }

      // 3. Update user
      const usersStr = localStorage.getItem("kalki_local_users") || "{}";
      const users = JSON.parse(usersStr);
      if (users[targetUserId]) {
        users[targetUserId].activeBookingId = null;
        triggerStorageUpdate("kalki_local_users", users);
      }

      console.log(`[SANDBOX] Booking ${targetBookingId} cancelled.`);
      return;
    }

    try {
      const updates = {};
      updates[`smartParking/bookings/${targetBookingId}/status`] = "cancelled";
      updates[`smartParking/slots/${targetSlotId}/status`] = "Vacant";
      updates[`smartParking/slots/${targetSlotId}/reservedBy`] = null;
      updates[`smartParking/slots/${targetSlotId}/reservationId`] = null;
      updates[`smartParking/slots/${targetSlotId}/lastUpdated`] = Date.now();
      updates[`smartParking/users/${targetUserId}/activeBookingId`] = null;

      await update(ref(db), updates);
      console.log(`Booking ${targetBookingId} cancelled.`);
    } catch (err) {
      console.error("Cancellation write failed, switching to sandbox:", err);
      setSandboxMode(true);
    }
  }, [activeBooking, userId]);

  return {
    userId,
    userProfile,
    activeBooking,
    allBookings,
    loading,
    timeToNextConfirm,
    timeToDeadline,
    showConfirmPrompt,
    showExpiredModal,
    setShowExpiredModal,
    lastExpiredSlot,
    bookSlot,
    confirmBooking,
    cancelBooking,
    expireBooking,
  };
}
