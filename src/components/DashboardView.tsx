import React from 'react';
import { GameProfile, TelemetryPoint, NetworkSettings } from '../types/network';
import { TelemetryChart } from './TelemetryChart';
import { OneClickBooster } from './OneClickBooster';
import { RouteVisualizer } from './RouteVisualizer';
import { 
  Wifi, 
  Activity, 
  ShieldCheck, 
  Gamepad2, 
  TrendingDown, 
  Globe, 
  Layers, 
  Zap,
  Server
} from 'lucide-react';
import { calculateBufferbloatScore } from '../services/networkSimulator';
import { NetworkHealth } from './NetworkHealth';
import { sounds } from '../utils/audio';

interface DashboardViewProps {
  telemetryHistory: TelemetryPoint[];
  currentPoint: TelemetryPoint;
  activeGame: GameProfile;
  settings: NetworkSettings;
  onApplyBoost: () => void;
  onRevertBoost: () => void;
  onNavigateTab: (tabId: 'games' | 'dns' | 'settings' | 'logs') => void;
  onToggleGameRunning: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  telemetryHistory,
  currentPoint,
  activeGame,
  settings,
  onApplyBoost,
  onRevertBoost,
  onNavigateTab,
  onToggleGameRunning,
}) => {
  const selectedServer = activeGame.servers.find(s => s.id === activeGame.selectedServerId) || activeGame.servers[0];
  const bufferbloat = calculateBufferbloatScore(currentPoint.jitter, currentPoint.packetLoss);

  return (
    <div className="space-y-6">
      {/* 4 Core Real-time KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Latency */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden font-mono group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Ping (RTT Latency)</span>
            <Wifi className={`w-3.5 h-3.5 ${settings.isBoostActive ? 'text-cyan-400' : 'text-amber-400'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tabular-nums flex items-baseline gap-1">
            {currentPoint.ping}
            <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {settings.isBoostActive ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> -{selectedServer.baselinePing - selectedServer.boostedPing}ms optimized
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">
                Unoptimized ISP route
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Packet Loss */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden font-mono group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Packet Loss Rate</span>
            <Activity className={`w-3.5 h-3.5 ${currentPoint.packetLoss === 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 tabular-nums flex items-baseline gap-1 ${
            currentPoint.packetLoss === 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {currentPoint.packetLoss}
            <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
            {currentPoint.packetLoss === 0 ? (
              <span className="text-emerald-300">0 dropped packets / sec</span>
            ) : (
              <span className="text-amber-400">{currentPoint.droppedPackets} retransmissions/s</span>
            )}
          </div>
        </div>

        {/* KPI 3: Jitter & Bufferbloat */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden font-mono group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Latency Jitter</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 mt-1.5 tabular-nums flex items-baseline gap-1">
            ±{currentPoint.jitter}
            <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className={`font-semibold ${bufferbloat.color}`}>
              Grade {bufferbloat.grade}: {bufferbloat.label}
            </span>
          </div>
        </div>

        {/* KPI 4: Active Game Session */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden font-mono group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Game Process</span>
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white mt-1.5 truncate">
            {activeGame.name}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-slate-400 truncate max-w-[120px]">{selectedServer.name}</span>
            <button
              onClick={() => {
                sounds.playClick();
                onNavigateTab('games');
              }}
              className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
            >
              Switch
            </button>
          </div>
        </div>
      </div>

      {/* One-Click Booster Hero Section */}
      <OneClickBooster
        isBoosted={settings.isBoostActive}
        onApplyBoost={onApplyBoost}
        onRevertBoost={onRevertBoost}
        baselinePing={selectedServer.baselinePing}
        boostedPing={selectedServer.boostedPing}
        activeGameName={activeGame.name}
      />

      {/* Live Ping & Packet Loss Telemetry Chart */}
      <TelemetryChart
        data={telemetryHistory}
        isBoosted={settings.isBoostActive}
        activeGameName={`${activeGame.name} (${selectedServer.name})`}
      />

      {/* Network Health: Simulated Speed Test & Summary Dashboard */}
      <NetworkHealth
        isBoosted={settings.isBoostActive}
        activeGameName={activeGame.name}
        serverLocation={selectedServer.location}
        onOptimizeRequested={onApplyBoost}
      />

      {/* Routing Topology & Hop Visualizer */}
      <RouteVisualizer
        isBoosted={settings.isBoostActive}
        gameServerName={`${activeGame.name} (${selectedServer.location})`}
      />
    </div>
  );
};
