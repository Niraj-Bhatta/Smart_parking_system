import React from "react";
import { CalendarX, X } from "lucide-react";

export default function ExpirationModal({ 
  isOpen, 
  onClose, 
  slotId 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-kalki-reserved/35 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl shadow-amber-950/20 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow indicator */}
        <div className="absolute inset-0 bg-gradient-to-b from-kalki-reserved/5 to-transparent pointer-events-none"></div>

        {/* Modal Header/Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body */}
        <div className="p-6 text-center">
          <div className="inline-flex p-4 rounded-full bg-kalki-reserved/10 text-kalki-reserved mb-4 border border-kalki-reserved/20 animate-pulse">
            <CalendarX className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-bold text-slate-100 mb-2 font-display uppercase tracking-wide">Reservation Expired</h3>
          <p className="text-slate-400 text-xs px-4 mb-6 leading-relaxed">
            Your reservation for slot <span className="text-kalki-reserved font-bold">{slotId}</span> has expired because the safety confirmation deadline was missed.
          </p>

          {/* Action Buttons */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-950/20 hover:shadow-amber-500/15 active:scale-[0.98] transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
