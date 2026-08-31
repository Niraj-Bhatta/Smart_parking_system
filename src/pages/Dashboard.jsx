import React, { useState, useEffect } from "react";
import { useSlotOccupancy } from "../hooks/useSlotOccupancy";
import { useBooking } from "../hooks/useBooking";
import SensorDashboard from "../components/SensorDashboard";
import SlotCard from "../components/SlotCard";
import BookingModal from "../components/BookingModal";
import ConfirmationPrompt from "../components/ConfirmationPrompt";
import CancelConfirmModal from "../components/CancelConfirmModal";
import ExpirationModal from "../components/ExpirationModal";
import BookingSuccessModal from "../components/BookingSuccessModal";
import OccupancyNoticeModal from "../components/OccupancyNoticeModal";
import { 
  Car, 
  Clock, 
  MapPin, 
  XCircle,
  HelpCircle,
  Award,
  AlertTriangle
} from "lucide-react";

export default function Dashboard({ liveData, isConnected }) {
  const { slots, loading: slotsLoading } = useSlotOccupancy();
  const {
    userId,
    userProfile,
    activeBooking,
    timeToNextConfirm,
    timeToDeadline,
    showConfirmPrompt,
    bookSlot,
    confirmBooking,
    cancelBooking,
    showExpiredModal,
    setShowExpiredModal,
    lastExpiredSlot,
  } = useBooking();

  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [cancelModalTarget, setCancelModalTarget] = useState(null); // { bookingId, slotId, userId }
  const [bookedSlotId, setBookedSlotId] = useState("");

  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [hasAlertedOccupied, setHasAlertedOccupied] = useState(false);

  const reservedSlot = slots.find((s) => s.id === activeBooking?.slotId);
  const isReservedSlotOccupied = reservedSlot?.occupied === true;

  // Auto alert on occupancy
  useEffect(() => {
    if (activeBooking && isReservedSlotOccupied && !hasAlertedOccupied) {
      setShowOccupancyModal(true);
      setHasAlertedOccupied(true);
    } else if (!activeBooking || !isReservedSlotOccupied) {
      setHasAlertedOccupied(false);
      setShowOccupancyModal(false);
    }
  }, [activeBooking, isReservedSlotOccupied, hasAlertedOccupied]);

  const handleOpenBookModal = (slotId) => {
    setSelectedSlotId(slotId);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = async (name, phone, email) => {
    if (selectedSlotId) {
      const targetId = selectedSlotId;
      await bookSlot(selectedSlotId, name, phone, email);
      setBookedSlotId(targetId);
    }
  };

  // Format countdowns for reservations
  const formatCountdown = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format system uptime for diagnostics strip
  const formatUptime = (ms) => {
    if (!ms) return "00h 00m 00s";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300 bg-kalki-bg text-kalki-textPrimary">
      
      {/* 2. Hero: Live miniature slot map */}
      <section className="text-center py-6 flex flex-col items-center">
        
        {/* Smart Parking Photo Banner */}
        <div className="max-w-4xl w-full px-4 mb-8">
          <img 
            src="/smart_parking.png" 
            alt="Kalki Smart Parking Installation" 
            className="w-full h-80 md:h-96 object-cover rounded-lg border border-kalki-border opacity-85 select-none pointer-events-none shadow-lg shadow-kalki-bg/80"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto w-full px-4 mb-6">
          {slots.map((slot) => {
            const isVacant = slot.status === "Vacant";
            const isOccupied = slot.status === "Occupied";
            const isReserved = slot.status === "Reserved";
            const isMaintenance = slot.status === "maintenance";

            let borderClass = "border-kalki-border";
            let textClass = "text-kalki-textMuted";
            let bgClass = "bg-kalki-panel";
            let pulseClass = "";
            let statusLabelText = "OFFLINE";

            if (isVacant) {
              borderClass = "border-kalki-vacant";
              textClass = "text-kalki-vacant";
              pulseClass = "animate-available-pulse";
              bgClass = "bg-[#121c17]";
              statusLabelText = "VACANT";
            } else if (isOccupied) {
              borderClass = "border-kalki-occupied";
              textClass = "text-kalki-occupied";
              bgClass = "bg-[#221515]";
              statusLabelText = "OCCUPIED";
            } else if (isReserved) {
              borderClass = "border-kalki-reserved";
              textClass = "text-kalki-reserved";
              bgClass = "bg-[#28211b]";
              statusLabelText = "RESERVED";
            } else if (isMaintenance) {
              borderClass = "border-kalki-border";
              textClass = "text-kalki-textMuted";
              bgClass = "bg-kalki-bg opacity-50";
              statusLabelText = "MAINT";
            }

            return (
              <div
                key={slot.id}
                className={`border-2 rounded-lg p-3 flex flex-col justify-between h-20 transition-all duration-300 ${borderClass} ${bgClass} ${pulseClass}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-kalki-textPrimary">SLOT {slot.id}</span>
                  {isVacant && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kalki-vacant opacity-75 motion-reduce:hidden"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-kalki-vacant"></span>
                    </span>
                  )}
                  {isOccupied && <span className="h-2 w-2 rounded-full bg-kalki-occupied"></span>}
                  {isReserved && <span className="h-2 w-2 rounded-full bg-kalki-reserved"></span>}
                  {isMaintenance && <span className="h-2 w-2 rounded-full bg-kalki-textMuted"></span>}
                </div>
                <div className="text-right">
                  <span className={`font-mono text-[10px] font-bold tracking-wider ${textClass}`}>
                    {statusLabelText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="font-sans text-xs sm:text-sm text-kalki-textMuted max-w-lg mx-auto px-4">
          Live parking availability, updated in real time from on-site sensors.
        </p>
      </section>

      {/* 3. System Status Strip */}
      <section className="border-t border-b border-kalki-border bg-kalki-panel/40 py-3.5 -mx-6 sm:mx-0 px-6 sm:rounded-lg">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-y-3 gap-x-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-kalki-textMuted tracking-wider uppercase font-semibold">Net Sync:</span>
            <span className={`font-bold ${isConnected ? "text-kalki-live" : "text-kalki-alert"}`}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-kalki-textMuted tracking-wider uppercase font-semibold">RSSI:</span>
            <span className="text-kalki-textPrimary font-semibold">
              {liveData?.connection?.wifiRssi ? `${liveData.connection.wifiRssi} dBm` : "N/A"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-kalki-textMuted tracking-wider uppercase font-semibold">Sync State:</span>
            <span className="text-kalki-reserved font-bold">
              {liveData?.connection?.synchronized ? "SYNCED" : "LIVE_STREAM"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-kalki-textMuted tracking-wider uppercase font-semibold">Uptime:</span>
            <span className="text-kalki-textPrimary font-semibold">
              {formatUptime(liveData?.device?.uptimeMs)}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Three-Panel info section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-2">
        <div className="border border-kalki-border bg-kalki-panel p-5 rounded-lg space-y-2">
          <h3 className="font-display font-bold text-xs text-kalki-textPrimary uppercase tracking-wider">Slot Detection</h3>
          <p className="font-sans text-xs text-kalki-textMuted leading-relaxed">
            Dual ultrasonic and infrared sensors verify if a vehicle is parked in a slot. The system compares both readouts to ensure the spot is empty before you arrive.
          </p>
        </div>

        <div className="border border-kalki-border bg-kalki-panel p-5 rounded-lg space-y-2">
          <h3 className="font-display font-bold text-xs text-kalki-textPrimary uppercase tracking-wider">Environment Monitoring</h3>
          <p className="font-sans text-xs text-kalki-textMuted leading-relaxed">
            On-site monitoring checks for safety hazards. We track air quality, gas levels, and vibration logs to ensure the garage environment is secure.
          </p>
        </div>

        <div className="border border-kalki-border bg-kalki-panel p-5 rounded-lg space-y-2">
          <h3 className="font-display font-bold text-xs text-kalki-textPrimary uppercase tracking-wider">Reserve Ahead</h3>
          <p className="font-sans text-xs text-kalki-textMuted leading-relaxed">
            Book your spot 15 minutes before you arrive. We will check in with you every 5 minutes to hold it. If you miss a check-in, the slot is released.
          </p>
        </div>
      </section>

      {/* Interactive live console segment */}
      <div className="border-t border-kalki-border pt-12 space-y-12">
        
        {/* Active Driver Reservation Panel */}
        {activeBooking && (
          <section className="bg-kalki-panel border border-kalki-reserved/30 rounded-xl p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-kalki-reserved font-bold mb-1">
                  <Car className="w-5 h-5 text-kalki-reserved" />
                  <span className="font-display text-xs uppercase tracking-wider">Active Booking Details</span>
                </div>
                <h3 className="text-lg font-bold text-kalki-textPrimary flex items-center gap-2 font-display">
                  Reserved Slot: <span className="text-kalki-reserved font-mono text-2xl">{activeBooking.slotId}</span>
                </h3>
                <p className="text-xs text-kalki-textMuted mt-1 font-sans">
                  Driver: <span className="text-kalki-textPrimary">{userProfile?.name}</span> ({userProfile?.phone})
                </p>
              </div>

              {/* Timers Grid */}
              <div className="flex flex-wrap gap-4 items-center">
                {/* Arrival Deadline Timer */}
                <div className="bg-kalki-bg border border-kalki-border px-4 py-2.5 rounded flex items-center gap-3">
                  <Clock className="w-4 h-4 text-kalki-reserved" />
                  <div>
                    <span className="block text-[9px] text-kalki-textMuted uppercase font-bold tracking-wider font-display">Arrive Within</span>
                    <span className="font-mono text-sm font-bold text-kalki-textPrimary">
                      {formatCountdown(timeToDeadline)}
                    </span>
                  </div>
                </div>

                {/* Next Confirmation Deadline Timer */}
                <div className="bg-kalki-bg border border-kalki-border px-4 py-2.5 rounded flex items-center gap-3">
                  <Clock className="w-4 h-4 text-kalki-live" />
                  <div>
                    <span className="block text-[9px] text-kalki-textMuted uppercase font-bold tracking-wider font-display">Confirm Check</span>
                    <span className="font-mono text-sm font-bold text-kalki-live">
                      {showConfirmPrompt ? "PROMPT ACTIVE" : formatCountdown(timeToNextConfirm)}
                    </span>
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => {
                    setCancelModalTarget({
                      bookingId: activeBooking.id,
                      slotId: activeBooking.slotId,
                      userId: activeBooking.userId
                    });
                  }}
                  className="px-4 py-2 bg-kalki-bg hover:bg-kalki-panel border border-kalki-border text-kalki-alert hover:text-kalki-alert/90 text-xs font-mono uppercase tracking-wider rounded font-bold h-11 transition focus:ring-2 focus:ring-kalki-alert focus:outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    Cancel Reservation
                  </span>
                </button>
              </div>
            </div>

            {/* Occupancy Notice */}
            {isReservedSlotOccupied && (
              <div className="mt-4 bg-kalki-alert/15 border border-kalki-alert/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex items-start gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-kalki-alert shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-kalki-textPrimary font-display uppercase tracking-wide">Slot Occupied</h4>
                    <p className="text-[11px] text-kalki-textMuted mt-0.5">
                      A vehicle is occupying slot <span className="font-mono font-bold text-kalki-textPrimary">{activeBooking.slotId}</span>. 
                      If this is not you, please report this or choose a different slot.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setCancelModalTarget({
                        bookingId: activeBooking.id,
                        slotId: activeBooking.slotId,
                        userId: activeBooking.userId
                      });
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-kalki-alert text-white font-bold font-display text-[10px] uppercase tracking-wider rounded transition hover:bg-kalki-alert/90 focus:ring-2 focus:ring-kalki-alert focus:outline-none"
                  >
                    Release & Re-book
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Live Slot Status (interactive selector) */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-kalki-textPrimary tracking-wider uppercase font-display flex items-center gap-2">
              <MapPin className="w-4 h-4 text-kalki-live" />
              Parking Bay Console
            </h2>
            <span className="text-[10px] text-kalki-textMuted font-mono">UPDATES STREAMING REAL-TIME</span>
          </div>

          {slotsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-kalki-panel border border-kalki-border animate-pulse flex items-center justify-center text-xs text-kalki-textMuted font-mono uppercase tracking-wider">
                  Loading slot telemetry...
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  currentUserId={userId}
                  isAdmin={false}
                  onBook={handleOpenBookModal}
                  onCancel={(resId, slotId) => {
                    setCancelModalTarget({
                      bookingId: resId,
                      slotId: slotId,
                      userId: userId
                    });
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Real-time Environment & Gate Sensors */}
        <section id="live-status" className="scroll-mt-24">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-kalki-textPrimary tracking-wider uppercase font-display flex items-center gap-2">
              <Award className="w-4 h-4 text-kalki-live" />
              Live Telemetry & Diagnostics
            </h2>
            <span className="text-[10px] text-kalki-textMuted font-mono">NODE ID: ESP32_RIG_01</span>
          </div>
          <SensorDashboard liveData={liveData} isConnected={isConnected} />
        </section>

        {/* Help Info Box */}
        <section className="bg-kalki-panel border border-kalki-border rounded-xl p-5 text-xs text-kalki-textMuted leading-relaxed flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-kalki-live shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-kalki-textPrimary font-display uppercase tracking-wider text-[10px]">Aggregator Node Logic:</p>
            <p className="font-sans">
              Parking slots derive their availability status dynamically. P1 and P2 bays verify states by matching ultrasonic distance metrics and infrared signals. If the two sensors report conflicting status data, the system flags a <span className="font-mono text-kalki-alert">Sensor Conflict</span> warning immediately instead of choosing one. Admin console flags and manual overrides override physical sensor readings when configured.
            </p>
          </div>
        </section>

      </div>

      {/* Booking Form Overlay Modal */}
      <BookingModal
        slotId={selectedSlotId}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onConfirm={handleConfirmBooking}
      />

      {/* 5-minute Confirmation Alert Overlay Modal */}
      <ConfirmationPrompt
        isOpen={showConfirmPrompt}
        timeRemainingMs={timeToNextConfirm}
        onConfirm={confirmBooking}
        onCancel={() => cancelBooking(activeBooking?.id, activeBooking?.slotId)}
      />

      <CancelConfirmModal
        isOpen={!!cancelModalTarget}
        onClose={() => setCancelModalTarget(null)}
        onConfirm={async () => {
          if (cancelModalTarget) {
            const { bookingId, slotId, userId: targetId } = cancelModalTarget;
            setCancelModalTarget(null);
            await cancelBooking(bookingId, slotId, targetId);
          }
        }}
        slotId={cancelModalTarget?.slotId}
      />

      <ExpirationModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        slotId={lastExpiredSlot}
      />

      <BookingSuccessModal
        isOpen={!!bookedSlotId}
        onClose={() => setBookedSlotId("")}
        slotId={bookedSlotId}
      />

      {activeBooking && (
        <OccupancyNoticeModal
          isOpen={showOccupancyModal}
          onClose={() => setShowOccupancyModal(false)}
          onRelease={async () => {
            setShowOccupancyModal(false);
            await cancelBooking(activeBooking.id, activeBooking.slotId, activeBooking.userId);
          }}
          slotId={activeBooking.slotId}
        />
      )}

    </div>
  );
}
