import React from "react";
import { 
  AlertTriangle, 
  UserCheck, 
  Wrench, 
  Car
} from "lucide-react";

export default function SlotCard({ 
  slot, 
  currentUserId, 
  isAdmin = false, 
  onBook, 
  onCancel, 
  onForceRelease, 
  onToggleMaintenance 
}) {
  const {
    id,
    status,
    dbStatus,
    hasConflict,
    reservedBy,
    reservationId,
    details = {}
  } = slot;

  const isUserBooking = reservedBy === currentUserId;

  // Determine color theme based on status and conflicts using Kalki tokens
  let cardStyles = "border-kalki-border bg-kalki-panel hover:border-kalki-textMuted/50";
  let statusBadgeStyles = "bg-kalki-bg text-kalki-textMuted border border-kalki-border";
  let statusLabel = "Vacant";

  if (status === "maintenance") {
    cardStyles = "border-kalki-border bg-kalki-panel opacity-60";
    statusBadgeStyles = "bg-kalki-bg text-kalki-textMuted border border-kalki-border";
    statusLabel = "Maintenance";
  } else if (hasConflict) {
    cardStyles = "border-kalki-occupied bg-kalki-panel border-dashed";
    statusBadgeStyles = "bg-kalki-occupied/20 text-kalki-occupied border border-kalki-occupied/30";
    statusLabel = "Sensor Conflict";
  } else if (status === "Occupied") {
    cardStyles = "border-kalki-occupied bg-[#221515] hover:border-kalki-occupied/80";
    statusBadgeStyles = "bg-kalki-occupied/15 text-kalki-occupied border border-kalki-occupied/20";
    statusLabel = "Occupied";
  } else if (status === "Reserved") {
    cardStyles = isUserBooking 
      ? "border-kalki-reserved bg-[#28211b] shadow-lg shadow-kalki-reserved/5"
      : "border-kalki-reserved/60 bg-[#201c18] hover:border-kalki-reserved";
    statusBadgeStyles = isUserBooking
      ? "bg-kalki-reserved/25 text-kalki-textPrimary border border-kalki-reserved/40"
      : "bg-kalki-reserved/15 text-kalki-reserved border border-kalki-reserved/20";
    statusLabel = isUserBooking ? "Your Booking" : "Reserved";
  } else {
    // Vacant
    cardStyles = "border-kalki-vacant bg-[#121c17] hover:border-kalki-vacant/80 animate-available-pulse";
    statusBadgeStyles = "bg-kalki-vacant/15 text-kalki-vacant border border-kalki-vacant/20";
    statusLabel = "Vacant";
  }

  return (
    <div className={`border rounded-xl p-5 shadow-none flex flex-col justify-between transition-all duration-300 ${cardStyles}`}>
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-lg font-bold text-kalki-textPrimary font-display flex items-center gap-2">
              <Car className={`w-5 h-5 ${
                status === "Occupied" ? "text-kalki-occupied" :
                status === "Reserved" ? "text-kalki-reserved" :
                status === "maintenance" ? "text-kalki-textMuted" : "text-kalki-vacant"
              }`} />
              Slot <span className="font-mono">{id}</span>
            </h4>
            <span className="text-[10px] text-kalki-textMuted font-mono">
              TYPE: {details.distance !== undefined ? "ULTRASONIC+IR" : "IR_ONLY"}
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-display uppercase tracking-wider ${statusBadgeStyles}`}>
            {statusLabel}
          </span>
        </div>

        {/* Sensor readings details in monospace JetBrains Mono */}
        <div className="space-y-2 mb-6 bg-kalki-bg/60 p-3 rounded-lg border border-kalki-border/40 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="text-kalki-textMuted uppercase text-[10px] tracking-wider">IR_Sensor:</span>
            <span className={`font-semibold ${details.ir ? "text-kalki-occupied" : "text-kalki-vacant"}`}>
              {details.ir ? "OBJECT_DETECTED" : "CLEAR"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-kalki-textMuted uppercase text-[10px] tracking-wider">Ultrasonic:</span>
            <span className="font-semibold text-kalki-textPrimary">
              {details.distance !== undefined ? `${details.distance} cm` : "N/A"}
            </span>
          </div>
        </div>

        {/* Conflict Warning */}
        {hasConflict && (
          <div className="flex items-start gap-2 bg-kalki-occupied/10 border border-kalki-occupied/30 rounded-lg p-2.5 mb-4">
            <AlertTriangle className="w-4 h-4 text-kalki-occupied shrink-0 mt-0.5" />
            <p className="text-[10px] text-kalki-textPrimary font-sans leading-relaxed">
              <strong>Sensor Mismatch!</strong> Ultrasonic (<span className="font-mono">{details.distance}cm</span>) and IR (<span className="font-mono">{details.ir ? "Blocked" : "Clear"}</span>) report conflicting occupancies. Check slot hardware.
            </p>
          </div>
        )}

        {/* Reservation Status detail */}
        {status === "Reserved" && (
          <div className="text-xs text-kalki-textMuted bg-kalki-bg/40 p-2.5 rounded-lg border border-kalki-border/50 mb-4 space-y-1">
            <div className="flex items-center gap-1.5 text-kalki-textPrimary font-medium">
              <UserCheck className="w-3.5 h-3.5 text-kalki-reserved" />
              <span className="font-sans">{isUserBooking ? "Reserved by You" : "Reserved Slot"}</span>
            </div>
            {isUserBooking && (
              <p className="text-[10px] text-kalki-textMuted font-mono">ID: {reservationId?.substr(-8).toUpperCase()}</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-2">
        {/* Admin panel logic overrides */}
        {isAdmin ? (
          <div className="space-y-2">
            <button
              onClick={() => onToggleMaintenance(id, dbStatus === "maintenance")}
              className={`w-full py-1.5 rounded text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 border transition focus:ring-2 focus:ring-kalki-live focus:outline-none ${
                dbStatus === "maintenance"
                  ? "bg-kalki-border border-kalki-border text-kalki-textPrimary hover:bg-kalki-border/80"
                  : "bg-kalki-bg border-kalki-border text-kalki-textMuted hover:bg-kalki-panel hover:text-kalki-textPrimary"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              {dbStatus === "maintenance" ? "End Maint" : "Set Maint"}
            </button>
            {dbStatus === "Reserved" && (
              <button
                onClick={() => onForceRelease(id, reservationId, reservedBy)}
                className="w-full py-1.5 rounded text-xs font-mono uppercase tracking-wider font-semibold bg-kalki-occupied/20 border border-kalki-occupied/40 text-kalki-textPrimary hover:bg-kalki-occupied/30 transition focus:ring-2 focus:ring-kalki-occupied focus:outline-none"
              >
                Force Release
              </button>
            )}
          </div>
        ) : (
          /* Driver View Actions */
          <div>
            {status === "Vacant" && (
              <button
                onClick={() => onBook(id)}
                className="w-full py-2 bg-kalki-vacant hover:bg-kalki-vacant/95 text-kalki-bg font-bold font-display text-xs uppercase tracking-wider rounded-lg transition-all focus:ring-2 focus:ring-kalki-vacant focus:outline-none"
              >
                Reserve Slot
              </button>
            )}
            
            {status === "Reserved" && isUserBooking && (
              <button
                onClick={() => onCancel(reservationId, id)}
                className="w-full py-2 bg-kalki-bg hover:bg-kalki-panel border border-kalki-border text-kalki-occupied hover:text-kalki-occupied/90 font-mono text-xs uppercase tracking-wider rounded-lg transition focus:ring-2 focus:ring-kalki-occupied focus:outline-none"
              >
                Cancel Reservation
              </button>
            )}

            {status === "Reserved" && !isUserBooking && (
              <button
                disabled
                className="w-full py-2 bg-kalki-bg/40 border border-kalki-border/40 text-kalki-textMuted/40 font-display text-xs uppercase tracking-wider rounded-lg cursor-not-allowed"
              >
                Reserved
              </button>
            )}

            {status === "Occupied" && (
              <button
                disabled
                className="w-full py-2 bg-kalki-bg/40 border border-kalki-border/40 text-kalki-textMuted/40 font-display text-xs uppercase tracking-wider rounded-lg cursor-not-allowed"
              >
                Occupied
              </button>
            )}

            {status === "maintenance" && (
              <button
                disabled
                className="w-full py-2 bg-kalki-bg/40 border border-kalki-border/40 text-kalki-textMuted/40 font-display text-xs uppercase tracking-wider rounded-lg cursor-not-allowed"
              >
                Under Maintenance
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
