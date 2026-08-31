import React from "react";
import { 
  Wifi, 
  WifiOff, 
  DoorOpen, 
  DoorClosed, 
  Thermometer, 
  Droplets, 
  Flame, 
  Activity, 
  ShieldAlert,
  Server,
  Zap
} from "lucide-react";

export default function SensorDashboard({ liveData, isConnected }) {
  if (!liveData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-kalki-panel border border-kalki-border rounded-xl animate-pulse">
        <Server className="w-12 h-12 text-kalki-live animate-spin mb-4" />
        <span className="text-kalki-textMuted font-mono text-xs uppercase tracking-wider">Connecting to Kalki Rig Sensors...</span>
      </div>
    );
  }

  const {
    alarms = {},
    connection = {},
    distancesCm = {},
    environment = {},
    gates = {},
    sequence = 0
  } = liveData;

  const isGasAlert = environment.mq2Raw > 2800 || alarms.gas;
  const isVibrationAlert = alarms.active;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 font-sans text-kalki-textPrimary">
      
      {/* 1. Gate Operations Card */}
      <div className="bg-kalki-panel border border-kalki-border rounded-xl p-5 shadow-none transition duration-300 hover:border-kalki-textMuted/45">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-kalki-textMuted font-display font-bold text-xs tracking-wider uppercase">Gate Operations</h3>
          <Zap className="w-5 h-5 text-kalki-live animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {gates.entryOpen ? (
                <DoorOpen className="w-5 h-5 text-kalki-live" />
              ) : (
                <DoorClosed className="w-5 h-5 text-kalki-alert" />
              )}
              <span className="text-kalki-textPrimary text-sm font-medium">Entry Gate</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
              gates.entryOpen ? "bg-kalki-live/15 text-kalki-live" : "bg-kalki-alert/15 text-kalki-alert"
            }`}>
              {gates.entryOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <p className="text-xs text-kalki-textMuted uppercase tracking-wider text-[10px]">
            Distance to sensor: <span className="text-kalki-textPrimary font-mono font-bold text-xs">{distancesCm.entry || 0} cm</span>
          </p>

          <hr className="border-kalki-border/40" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {gates.exitOpen ? (
                <DoorOpen className="w-5 h-5 text-kalki-live" />
              ) : (
                <DoorClosed className="w-5 h-5 text-kalki-alert" />
              )}
              <span className="text-kalki-textPrimary text-sm font-medium">Exit Gate</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
              gates.exitOpen ? "bg-kalki-live/15 text-kalki-live" : "bg-kalki-alert/15 text-kalki-alert"
            }`}>
              {gates.exitOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <p className="text-xs text-kalki-textMuted uppercase tracking-wider text-[10px]">
            Distance to sensor: <span className="text-kalki-textPrimary font-mono font-bold text-xs">{distancesCm.exit || 0} cm</span>
          </p>
        </div>
      </div>

      {/* 2. Connection Health Card */}
      <div className="bg-kalki-panel border border-kalki-border rounded-xl p-5 shadow-none transition duration-300 hover:border-kalki-textMuted/45">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-kalki-textMuted font-display font-bold text-xs tracking-wider uppercase">Diagnostics & Sync</h3>
          {isConnected ? (
            <Wifi className="w-5 h-5 text-kalki-live" />
          ) : (
            <WifiOff className="w-5 h-5 text-kalki-alert" />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-kalki-bg p-2 rounded border border-kalki-border/40">
            <span className="text-kalki-textMuted block text-[9px] uppercase tracking-wider mb-1">Firebase Sync</span>
            <span className={`font-bold ${isConnected ? "text-kalki-live" : "text-kalki-alert"}`}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <div className="bg-kalki-bg p-2 rounded border border-kalki-border/40">
            <span className="text-kalki-textMuted block text-[9px] uppercase tracking-wider mb-1">Uno Status</span>
            <span className={`font-bold ${connection.unoOnline ? "text-kalki-live" : "text-kalki-alert"}`}>
              {connection.unoOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <div className="bg-kalki-bg p-2 rounded border border-kalki-border/40">
            <span className="text-kalki-textMuted block text-[9px] uppercase tracking-wider mb-1">Signal strength</span>
            <span className="text-kalki-reserved font-bold text-[10px]">
              {connection.wifiRssi || 0} dBm
            </span>
          </div>
          <div className="bg-kalki-bg p-2 rounded border border-kalki-border/40">
            <span className="text-kalki-textMuted block text-[9px] uppercase tracking-wider mb-1">Arduino-ESP</span>
            <span className={`font-bold ${connection.unoSeesEsp ? "text-kalki-live" : "text-kalki-alert"}`}>
              {connection.unoSeesEsp ? "CONNECTED" : "DISCONN"}
            </span>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center text-[9px] text-kalki-textMuted font-mono">
          <span>OK: {connection.validPackets} / ERR: {connection.badPackets}</span>
          <span>SEQ: {sequence}</span>
        </div>
      </div>

      {/* 3. Environment Conditions Card */}
      <div className="bg-kalki-panel border border-kalki-border rounded-xl p-5 shadow-none transition duration-300 hover:border-kalki-textMuted/45">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-kalki-textMuted font-display font-bold text-xs tracking-wider uppercase">Atmospherics</h3>
          <Thermometer className="w-5 h-5 text-kalki-live" />
        </div>
        
        <div className="flex justify-around items-center h-28">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-kalki-live/10 text-kalki-live mb-2 border border-kalki-live/10">
              <Thermometer className="w-5 h-5" />
            </div>
            <span className="block text-kalki-textMuted text-[9px] uppercase tracking-wider font-semibold">Temperature</span>
            <span className="text-base font-bold text-kalki-textPrimary font-mono">{environment.temperatureC || 0}°C</span>
          </div>

          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-kalki-reserved/10 text-kalki-reserved mb-2 border border-kalki-reserved/10">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="block text-kalki-textMuted text-[9px] uppercase tracking-wider font-semibold">Humidity</span>
            <span className="text-base font-bold text-kalki-textPrimary font-mono">{environment.humidityPct || 0}%</span>
          </div>
        </div>
      </div>

      {/* 4. Safety & Vibration Alerts Card */}
      <div className={`border rounded-xl p-5 shadow-none transition duration-300 ${
        isGasAlert || isVibrationAlert 
          ? "bg-kalki-alert/10 border-kalki-alert" 
          : "bg-kalki-panel border-kalki-border hover:border-kalki-textMuted/45"
      }`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-kalki-textMuted font-display font-bold text-xs tracking-wider uppercase">Safety & Security</h3>
          {isGasAlert || isVibrationAlert ? (
            <ShieldAlert className="w-5 h-5 text-kalki-alert animate-bounce" />
          ) : (
            <Activity className="w-5 h-5 text-kalki-textMuted" />
          )}
        </div>
        
        <div className="space-y-4 text-xs">
          {/* Gas detection indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${isGasAlert ? "text-kalki-alert" : "text-kalki-textMuted"}`} />
              <span className="text-xs text-kalki-textPrimary">Gas Level (MQ-2)</span>
            </div>
            <div className="text-right">
              <span className={`font-mono font-bold text-xs block ${isGasAlert ? "text-kalki-alert" : "text-kalki-textPrimary"}`}>
                {environment.mq2Raw || 0}
              </span>
              <span className="text-[9px] text-kalki-textMuted font-mono block">
                {environment.mq2WarmedUp ? "WARMED UP" : "HEATING..."}
              </span>
            </div>
          </div>

          <hr className="border-kalki-border/40" />

          {/* Piezo / Vibration alarm */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isVibrationAlert ? "text-kalki-alert" : "text-kalki-textMuted"}`} />
              <span className="text-xs text-kalki-textPrimary">Vibration Alarm</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
              isVibrationAlert ? "bg-kalki-alert text-white animate-pulse" : "bg-kalki-bg text-kalki-textMuted border border-kalki-border/40"
            }`}>
              {isVibrationAlert ? "TRIGGERED" : "SECURE"}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
