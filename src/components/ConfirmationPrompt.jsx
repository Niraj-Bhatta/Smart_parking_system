import React from "react";
import { AlertCircle, Clock, Check } from "lucide-react";

export default function ConfirmationPrompt({ 
  isOpen, 
  timeRemainingMs, 
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;

  // Format time remaining (e.g. 04:32)
  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl shadow-amber-950/20 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow indicator */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>

        {/* Modal Body */}
        <div className="p-6 text-center">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20 animate-pulse">
            <AlertCircle className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-bold text-slate-100 mb-2">Are you still coming?</h3>
          <p className="text-slate-400 text-xs px-4 mb-6 leading-relaxed">
            Please confirm your reservation status to hold the parking slot. If you don't confirm within the deadline, your reservation will expire.
          </p>

          {/* Countdown Clock */}
          <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-2xl mb-8">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="font-mono text-lg font-bold text-amber-300">
              {formatTime(timeRemainingMs)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onConfirm}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-950/20 hover:shadow-amber-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Yes, Keep My Reservation
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Cancel Reservation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
