import React, { useState, useEffect } from "react";
import { useSlotOccupancy } from "../hooks/useSlotOccupancy";
import { useBooking } from "../hooks/useBooking";
import CancelConfirmModal from "../components/CancelConfirmModal";
import ExpirationModal from "../components/ExpirationModal";
import BookingSuccessModal from "../components/BookingSuccessModal";
import OccupancyNoticeModal from "../components/OccupancyNoticeModal";
import { 
  Car, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  HelpCircle,
  CalendarDays
} from "lucide-react";

export default function BookingPage() {
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

  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const isSandbox = localStorage.getItem("kalki_sandbox") === "true";
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
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

  // Clear success and error messages when activeBooking vanishes (due to cancellation/timeout)
  useEffect(() => {
    if (!activeBooking) {
      setSuccessMsg("");
      setError("");
    }
  }, [activeBooking]);

  // Format countdowns
  const formatCountdown = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!selectedSlotId) {
      setError("Please select a parking slot.");
      return;
    }
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Please fill out all driver details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = selectedSlotId;
      await bookSlot(selectedSlotId, name, phone, email);
      setBookedSlotId(targetId);
      // Reset form selection
      setSelectedSlotId("");
    } catch (err) {
      console.error("Booking error:", err);
      setError("Failed to create reservation. The slot might have just been taken. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find only vacant slots
  const vacantSlots = slots.filter((s) => s.status === "Vacant");

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Block */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight uppercase flex items-center justify-center gap-2">
          <CalendarDays className="w-7 h-7 text-kalki-vacant" />
          Kalki Reservation Portal
        </h1>
        <p className="font-sans text-xs sm:text-sm text-kalki-textMuted max-w-lg mx-auto">
          Secure your parking spot 15 minutes before your arrival with automatic sensor sync and periodic check-in holds.
        </p>
      </div>

      <div className="h-px bg-kalki-border w-24 mx-auto" />

      {isSandbox && (
        <div className="bg-kalki-reserved/10 border border-kalki-reserved/25 rounded-xl p-4 text-xs text-kalki-reserved flex items-start gap-2.5 max-w-2xl mx-auto animate-in fade-in duration-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-kalki-reserved" />
          <div>
            <strong className="text-kalki-textPrimary">Offline Sandbox Mode Active</strong>: Firebase Authentication failed due to invalid credentials. Database writes and updates are simulated locally using browser local storage. Once you configure a valid API key, live database sync will automatically resume.
          </div>
        </div>
      )}

      {/* Main Section */}
      {activeBooking ? (
        /* Active Booking Management Dashboard view */
        <div className="bg-kalki-panel border border-kalki-reserved/30 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-kalki-reserved/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-kalki-border/60 pb-6 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-kalki-reserved font-bold text-xs uppercase tracking-wider mb-2 font-display">
                <Car className="w-4 h-4" />
                Active Driver Reservation
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-kalki-textPrimary font-display">
                Slot Reserved: <span className="text-kalki-reserved font-mono text-2xl sm:text-3xl">{activeBooking.slotId}</span>
              </h2>
              <p className="text-xs text-kalki-textMuted mt-1 font-sans">
                Driver: <span className="text-kalki-textPrimary">{userProfile?.name || "Registered Driver"}</span> ({userProfile?.phone})
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-kalki-reserved/10 border border-kalki-reserved text-kalki-reserved rounded text-[10px] font-bold font-display uppercase tracking-wider">
              Hold Active
            </div>
          </div>

          {/* Timers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Arrival Deadline */}
            <div className="bg-kalki-bg border border-kalki-border rounded-xl p-4 flex items-center gap-4">
              <Clock className="w-8 h-8 text-kalki-reserved shrink-0" />
              <div>
                <span className="block text-[10px] text-kalki-textMuted uppercase font-bold tracking-wider font-display">Arrive Within</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-kalki-textPrimary">
                  {formatCountdown(timeToDeadline)}
                </span>
                <span className="block text-[10px] text-kalki-textMuted mt-0.5">Deadline expires in 15m window</span>
              </div>
            </div>

            {/* Next Check-in */}
            <div className="bg-kalki-bg border border-kalki-border rounded-xl p-4 flex items-center gap-4">
              <Clock className={`w-8 h-8 shrink-0 ${showConfirmPrompt ? "text-kalki-alert animate-pulse" : "text-kalki-live"}`} />
              <div>
                <span className="block text-[10px] text-kalki-textMuted uppercase font-bold tracking-wider font-display">Next Confirmation Check</span>
                <span className={`font-mono text-xl sm:text-2xl font-bold block ${showConfirmPrompt ? "text-kalki-alert" : "text-kalki-live"}`}>
                  {showConfirmPrompt ? "PROMPT ACTIVE" : formatCountdown(timeToNextConfirm)}
                </span>
                <span className="block text-[10px] text-kalki-textMuted mt-0.5">Every 5 minutes safety check-in</span>
              </div>
            </div>
          </div>

          {/* Active Confirmation Prompt Alert Panel */}
          {showConfirmPrompt && (
            <div className="bg-kalki-alert/10 border border-kalki-alert/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <AlertTriangle className="w-6 h-6 text-kalki-alert shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-kalki-textPrimary font-display uppercase tracking-wide">Still Coming?</h4>
                  <p className="text-xs text-kalki-textMuted mt-0.5">
                    Please confirm your status inside the 5-minute prompt window to prevent slot release.
                  </p>
                </div>
              </div>
              <button
                onClick={confirmBooking}
                className="w-full sm:w-auto px-5 py-2.5 bg-kalki-live text-kalki-bg font-bold font-display text-xs uppercase tracking-wider rounded-lg transition hover:bg-kalki-live/90 focus:ring-2 focus:ring-kalki-live focus:outline-none"
              >
                Confirm Still Coming
              </button>
            </div>
          )}

          {/* Occupancy Notice */}
          {isReservedSlotOccupied && (
            <div className="bg-kalki-alert/15 border border-kalki-alert/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-start gap-3 text-left">
                <AlertTriangle className="w-6 h-6 text-kalki-alert shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-kalki-textPrimary font-display uppercase tracking-wide">Slot Occupied</h4>
                  <p className="text-xs text-kalki-textMuted mt-0.5">
                    A vehicle is currently occupying your reserved slot <span className="font-mono font-bold text-kalki-textPrimary">{activeBooking.slotId}</span>. 
                    If this is your vehicle, your reservation is successfully checked-in. 
                    If you haven't arrived yet, another vehicle may have taken your spot.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-4 py-2 bg-kalki-alert text-white font-bold font-display text-xs uppercase tracking-wider rounded-lg transition hover:bg-kalki-alert/90 focus:ring-2 focus:ring-kalki-alert focus:outline-none"
                >
                  Release & Book Another
                </button>
              </div>
            </div>
          )}

          {/* Information Notice */}
          <div className="bg-kalki-bg border border-kalki-border/50 rounded-xl p-4 text-xs text-kalki-textMuted leading-relaxed flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-kalki-live shrink-0 mt-0.5" />
            <div>
              <strong className="text-kalki-textPrimary">Auto-Release Sensor Logic</strong>: If a vehicle triggers the slot's physical sensors (ultrasonic/IR), the reservation automatically marks as <strong>Occupied</strong> and registers your arrival. If no vehicle arrives within 15 minutes, or you miss the check-in timer, the booking expires automatically and releases the slot.
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-kalki-border/60">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-5 py-2.5 bg-kalki-bg hover:bg-kalki-panel border border-kalki-border text-kalki-alert hover:text-kalki-alert/90 text-xs font-mono uppercase tracking-wider rounded-lg font-bold flex items-center gap-1.5 transition"
            >
              <XCircle className="w-4 h-4" />
              Cancel Reservation
            </button>
          </div>

        </div>
      ) : (
        /* Create Reservation Form view */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left panel: Info & instructions */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-kalki-panel border border-kalki-border rounded-2xl p-5 space-y-4">
              <h3 className="font-display font-bold text-xs text-kalki-textPrimary uppercase tracking-wider">How Booking Works</h3>
              
              <ul className="space-y-3 text-xs text-kalki-textMuted">
                <li className="flex gap-2">
                  <span className="text-kalki-live font-bold font-mono">1.</span>
                  <span>Select any of the vacant spots from the list of bays.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-kalki-live font-bold font-mono">2.</span>
                  <span>Enter your driver profile. We will save it in the system.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-kalki-live font-bold font-mono">3.</span>
                  <span>You have exactly <strong>15 minutes</strong> to arrive at the slot before it expires.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-kalki-live font-bold font-mono">4.</span>
                  <span>A check-in prompt appears <strong>every 5 minutes</strong>. Tap it to maintain the hold.</span>
                </li>
              </ul>
            </div>

            <div className="bg-kalki-panel/40 border border-kalki-border rounded-2xl p-5 text-xs text-kalki-textMuted leading-relaxed space-y-2">
              <h4 className="font-display font-bold text-[10px] text-kalki-textPrimary uppercase tracking-wider">ESP32 Integration</h4>
              <p>
                Our parking lot uses ultrasonic distance nodes and infrared presence sensors. Once you pull in, the sensor automatically checks you in—no manual phone confirmation required at the bay.
              </p>
            </div>
          </div>

          {/* Right panel: The booking Form */}
          <div className="md:col-span-3 bg-kalki-panel border border-kalki-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
            
            <h2 className="text-sm font-bold text-kalki-textPrimary font-display uppercase tracking-wider pb-3 border-b border-kalki-border/60">
              New Spot Reservation
            </h2>

            {error && (
              <div className="bg-kalki-alert/10 border border-kalki-alert/25 rounded-xl p-3 text-xs text-kalki-alert flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-kalki-vacant/10 border border-kalki-vacant/25 rounded-xl p-3 text-xs text-kalki-vacant flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-5">
              
              {/* Slot selector */}
              <div>
                <label className="block text-[10px] font-bold text-kalki-textMuted uppercase tracking-wider mb-2 font-display">
                  Select Parking Slot
                </label>
                {slotsLoading ? (
                  <div className="h-12 bg-kalki-bg/40 border border-kalki-border animate-pulse rounded-xl" />
                ) : vacantSlots.length === 0 ? (
                  <div className="bg-kalki-alert/5 border border-kalki-alert/10 text-kalki-alert rounded-xl p-4 text-xs text-center font-mono uppercase tracking-wider">
                    ⚠️ No vacant slots available right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const isVacant = slot.status === "Vacant";
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!isVacant}
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                            setError("");
                          }}
                          className={`py-3.5 border rounded-xl font-mono text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                            !isVacant
                              ? "bg-kalki-bg/30 border-kalki-border/30 text-kalki-textMuted/40 cursor-not-allowed"
                              : selectedSlotId === slot.id
                              ? "bg-kalki-vacant/10 border-kalki-vacant text-kalki-vacant shadow-lg shadow-kalki-vacant/5"
                              : "bg-kalki-bg border-kalki-border text-kalki-textPrimary hover:border-kalki-textMuted/60"
                          }`}
                        >
                          <span>SLOT {slot.id}</span>
                          <span className={`text-[9px] uppercase font-sans tracking-wide ${
                            isVacant ? "text-kalki-vacant" : "text-kalki-textMuted"
                          }`}>
                            {isVacant ? "Vacant" : slot.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Driver Name input */}
              <div>
                <label className="block text-[10px] font-bold text-kalki-textMuted uppercase tracking-wider mb-2 font-display">
                  Driver Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-kalki-textMuted/60">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Niraj Bhatta"
                    className="w-full bg-kalki-bg border border-kalki-border rounded-xl py-3 pl-10 pr-4 text-xs text-kalki-textPrimary placeholder-kalki-textMuted/40 focus:border-kalki-vacant focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Phone input */}
              <div>
                <label className="block text-[10px] font-bold text-kalki-textMuted uppercase tracking-wider mb-2 font-display">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-kalki-textMuted/60">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +977-9800000000"
                    className="w-full bg-kalki-bg border border-kalki-border rounded-xl py-3 pl-10 pr-4 text-xs text-kalki-textPrimary placeholder-kalki-textMuted/40 focus:border-kalki-vacant focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Email input */}
              <div>
                <label className="block text-[10px] font-bold text-kalki-textMuted uppercase tracking-wider mb-2 font-display">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-kalki-textMuted/60">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. niraj@kalki.io"
                    className="w-full bg-kalki-bg border border-kalki-border rounded-xl py-3 pl-10 pr-4 text-xs text-kalki-textPrimary placeholder-kalki-textMuted/40 focus:border-kalki-vacant focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Deadline Selection (Visual reminder or dropdown) */}
              <div className="bg-kalki-bg border border-kalki-border rounded-xl p-3.5 text-xs text-kalki-textMuted leading-normal flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-kalki-reserved shrink-0 mt-0.5" />
                <div>
                  <span className="text-kalki-textPrimary font-semibold">15-Minute Arrival Offset</span>: System allocates a 15-minute lead window. If your vehicle is not detected by ultrasonic sensor or if you miss check-in, the slot reverts to vacant.
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={isSubmitting || vacantSlots.length === 0}
                className="w-full py-3 bg-kalki-vacant hover:bg-kalki-vacant/90 disabled:opacity-40 text-kalki-bg text-xs font-bold uppercase tracking-wider rounded-xl font-display shadow-lg shadow-kalki-vacant/10 hover:shadow-kalki-vacant/15 active:scale-[0.99] transition-all"
              >
                {isSubmitting ? "Generating Holding Lock..." : "Confirm & Hold Slot"}
              </button>

            </form>
          </div>
        </div>
      )}

      {activeBooking && (
        <CancelConfirmModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={async () => {
            setIsCancelModalOpen(false);
            await cancelBooking(activeBooking.id, activeBooking.slotId, activeBooking.userId);
          }}
          slotId={activeBooking?.slotId}
        />
      )}

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
