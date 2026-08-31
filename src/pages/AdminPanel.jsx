import React, { useState, useEffect } from "react";
import { useSlotOccupancy } from "../hooks/useSlotOccupancy";
import { useBooking } from "../hooks/useBooking";
import SlotCard from "../components/SlotCard";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend,
  CartesianGrid
} from "recharts";
import { 
  ListFilter, 
  Activity, 
  TrendingUp, 
  Terminal, 
  Sliders
} from "lucide-react";

export default function AdminPanel({ liveData }) {
  const { slots, updateSlotStatus, loading: slotsLoading } = useSlotOccupancy();
  const { allBookings, cancelBooking } = useBooking();
  const [filterStatus, setFilterStatus] = useState("all");
  const [diagnosticsHistory, setDiagnosticsHistory] = useState([]);

  // Collect rolling history for charts (max 15 entries)
  useEffect(() => {
    if (!liveData) return;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    
    setDiagnosticsHistory((prev) => {
      const next = [
        ...prev,
        {
          time: timeStr,
          rssi: liveData.connection?.wifiRssi || 0,
          valid: liveData.connection?.validPackets || 0,
          bad: liveData.connection?.badPackets || 0,
          uptime: (liveData.device?.uptimeMs || 0) / 1000, // seconds
        }
      ];
      if (next.length > 15) {
        return next.slice(1);
      }
      return next;
    });
  }, [liveData]);

  const handleForceRelease = async (slotId, reservationId, userId) => {
    if (confirm(`Are you sure you want to FORCE RELEASE slot ${slotId}? This will cancel the active booking.`)) {
      if (reservationId) {
        await cancelBooking(reservationId, slotId, userId);
      } else {
        // Just clear the slot in DB directly
        await updateSlotStatus(slotId, "Vacant", {
          occupied: false,
          reservedBy: null,
          reservationId: null
        });
      }
    }
  };

  const handleToggleMaintenance = async (slotId, isCurrentlyMaintenance) => {
    const nextStatus = isCurrentlyMaintenance ? "Vacant" : "maintenance";
    if (confirm(`Set slot ${slotId} to ${nextStatus.toUpperCase()} mode?`)) {
      await updateSlotStatus(slotId, nextStatus, {
        occupied: false,
        reservedBy: null,
        reservationId: null
      });
    }
  };

  // Filter bookings list
  const filteredBookings = allBookings.filter((b) => {
    if (filterStatus === "all") return true;
    return b.status === filterStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Admin Overrides & Manual Slots Configuration */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-100 tracking-wide uppercase flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Manual Slot Overrides
          </h2>
          <span className="text-xs text-slate-500">Bypass sensor readings & clear booking holds</span>
        </div>

        {slotsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900/60 border border-slate-850 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isAdmin={true}
                onForceRelease={handleForceRelease}
                onToggleMaintenance={handleToggleMaintenance}
              />
            ))}
          </div>
        )}
      </section>

      {/* Connection & Diagnostics Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Wifi RSSI Trend chart */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Wifi RSSI Signal Trend
              </h3>
              <p className="text-[10px] text-slate-500">Live signal level in dBm (higher is better)</p>
            </div>
            <span className="font-mono text-xs text-indigo-400 font-semibold">
              Current: {liveData?.connection?.wifiRssi || 0} dBm
            </span>
          </div>

          <div className="h-64 w-full">
            {diagnosticsHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Waiting for sensor data packets...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diagnosticsHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRssi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                  <YAxis domain={[-90, -30]} stroke="#64748b" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
                    itemStyle={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="rssi" name="Signal (dBm)" stroke="#10b981" fillOpacity={1} fill="url(#colorRssi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Transmission packets balance chart */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                Network Packets Distribution
              </h3>
              <p className="text-[10px] text-slate-500">Ratio of valid packets to CRC errors</p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Seq: {liveData?.sequence}
            </span>
          </div>

          <div className="h-64 w-full">
            {diagnosticsHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Waiting for sensor data packets...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diagnosticsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="valid" name="Valid Transmissions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bad" name="CRC Bad Packets" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </section>

      {/* Bookings log table */}
      <section className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4 border-b border-slate-850">
          <div>
            <h3 className="text-md font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Reservation Activity Log
            </h3>
            <p className="text-xs text-slate-500">Auditable list of all reservation statuses</p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850">
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer"
            >
              <option value="all">Filter: All Statuses</option>
              <option value="pending_confirmation">Pending Confirmation</option>
              <option value="confirmed">Confirmed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No booking entries found matching filter.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-500 text-[10px] font-bold tracking-wider uppercase border-b border-slate-850">
                  <th className="py-4 px-6">Booking ID</th>
                  <th className="py-4 px-4">User</th>
                  <th className="py-4 px-4">Slot</th>
                  <th className="py-4 px-4">Reserved At</th>
                  <th className="py-4 px-4">Arrival Deadline</th>
                  <th className="py-4 px-4">Confirmation Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {filteredBookings.map((booking) => {
                  const bookedDate = booking.bookedAt ? new Date(booking.bookedAt) : null;
                  const deadlineDate = booking.arrivalDeadline ? new Date(booking.arrivalDeadline) : null;
                  const isBookingActive = booking.status && (booking.status === "pending_confirmation" || booking.status === "confirmed");

                  return (
                    <tr key={booking.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-4 px-6 font-mono text-slate-400">{booking.id ? booking.id.substr(-10) : "N/A"}</td>
                      <td className="py-4 px-4">
                        <span className="text-slate-300 block font-semibold">{booking.userId ? booking.userId.substr(0, 10) : "N/A"}</span>
                        <span className="text-[10px] text-slate-500 block">UID: {booking.userId ? booking.userId.substr(-8) : "N/A"}</span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-200">{booking.slotId || "N/A"}</td>
                      <td className="py-4 px-4 text-slate-400">
                        {bookedDate ? `${bookedDate.toLocaleDateString()} ${bookedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "N/A"}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {deadlineDate ? deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          booking.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" :
                          booking.status === "pending_confirmation" ? "bg-amber-500/10 text-amber-400 animate-pulse" :
                          booking.status === "expired" ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-500"
                        }`}>
                          {booking.status ? booking.status.toUpperCase().replace("_", " ") : "UNKNOWN"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isBookingActive && (
                          <button
                            onClick={() => cancelBooking(booking.id, booking.slotId, booking.userId)}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded-lg transition"
                          >
                            Release Slot
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

    </div>
  );
}
