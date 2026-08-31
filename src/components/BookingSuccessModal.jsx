import React from "react";
import { CheckCircle2, X } from "lucide-react";

export default function BookingSuccessModal({ 
  isOpen, 
  onClose, 
  slotId 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-kalki-vacant/35 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl shadow-emerald-950/20 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow indicator */}
        <div className="absolute inset-0 bg-gradient-to-b from-kalki-vacant/5 to-transparent pointer-events-none"></div>

        {/* Modal Header/Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body */}
        <div className="p-6 text-center">
          <div className="inline-flex p-4 rounded-full bg-kalki-vacant/10 text-kalki-vacant mb-4 border border-kalki-vacant/20 animate-pulse">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-bold text-slate-100 mb-2 font-display uppercase tracking-wide">Slot Reserved!</h3>
          <p className="text-slate-400 text-xs px-4 mb-6 leading-relaxed">
            Slot <span className="text-kalki-vacant font-bold">{slotId}</span> has been successfully held for you.
          </p>

          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-left text-xs text-kalki-textMuted mb-6 space-y-2">
            <div className="flex justify-between">
              <span>Arrival Offset:</span>
              <span className="text-slate-200 font-bold font-mono">15 Minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Check-in Prompt:</span>
              <span className="text-slate-200 font-bold font-mono">Every 5 Minutes</span>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/15 active:scale-[0.98] transition-all"
          >
            Go to Active Booking
          </button>
        </div>
      </div>
    </div>
  );
}
