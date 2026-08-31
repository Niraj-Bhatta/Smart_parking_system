import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/config";

export function useLiveSensors() {
  const [liveData, setLiveData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Listen to Firebase connection state
    const connectedRef = ref(db, ".info/connected");
    const unsubscribeConnected = onValue(
      connectedRef,
      (snap) => {
        setIsConnected(!!snap.val());
      },
      (err) => {
        console.error("Connection state listener error:", err);
      }
    );

    // 2. Listen to real-time sensor and health data
    const liveRef = ref(db, "smartParking/live");
    const unsubscribeLive = onValue(
      liveRef,
      (snap) => {
        const data = snap.val();
        setLiveData(data);
        setLoading(false);
      },
      (err) => {
        console.error("Live sensors listener error:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Clean up listeners on unmount
    return () => {
      unsubscribeConnected();
      unsubscribeLive();
    };
  }, []);

  return { liveData, isConnected, loading, error };
}
