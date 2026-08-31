import React from "react";
import { AlertTriangle, X, Car } from "lucide-react";

export default function OccupancyNoticeModal({ 
  isOpen, 
  onClose, 
  onRelease, 
  slotId 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-kalki-alert/30 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl shadow-red-950/20 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow indicator */}
        <div className="absolute inset-0 bg-gradient-to-b from-kalki-alert/5 to-transparent pointer-events-none"></div>

        {/* Modal Header/Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body */}
        <div className="p-6 text-center">
          <div className="inline-flex p-4 rounded-full bg-kalki-alert/10 text-kalki-alert mb-4 border border-kalki-alert/20 animate-pulse">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-bold text-slate-100 mb-2 font-display uppercase tracking-wide">Slot Occupied</h3>
          <p className="text-slate-400 text-xs px-4 mb-6 leading-relaxed">
            A vehicle has been detected in your reserved slot <span className="text-kalki-alert font-bold">{slotId}</span>. 
            <br />
            <span className="block mt-2">
              If this is your vehicle, you are successfully checked-in. If you haven't arrived yet, another vehicle may have taken your spot.
            </span>
          </p>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onRelease}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/20 hover:shadow-red-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Car className="w-4 h-4" />
              Release & Book Another
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              This is My Car / Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
