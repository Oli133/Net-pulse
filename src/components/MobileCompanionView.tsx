import React from 'react';
import { TelemetryPoint } from '../types/network';
import { 
  Zap, 
  RotateCcw, 
  ShieldCheck, 
  Activity, 
  Smartphone, 
  Maximize2,
  Gamepad2,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface MobileCompanionViewProps {
  currentPoint: TelemetryPoint;
  isBoosted: boolean;
  onApplyBoost: () => void;
  onRevertBoost: () => void;
  activeGameName: string;
  activeServerName: string;
  onExitCompanion: () => void;
}

export const MobileCompanionView: React.FC<MobileCompanionViewProps> = ({
  currentPoint,
  isBoosted,
  onApplyBoost,
  onRevertBoost,
  activeGameName,
  activeServerName,
  onExitCompanion,
}) => {
  return (
    <div className="flex flex-col min-h-[500px] justify-between p-4 max-w-md mx-auto w-full select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">NetPulse Mobile Desk HUD</div>
            <div className="text-[10px] text-slate-400 font-mono">{activeGameName} · {activeServerName}</div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onExitCompanion();
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 hover:text-white"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Full UI</span>
        </button>
      </div>

      {/* Hero Massive Metric Dial */}
      <div className="my-6 flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 ${
            isBoosted 
              ? 'border-cyan-500/40 bg-slate-900/90 glow-cyan' 
              : 'border-amber-500/40 bg-slate-900/90 glow-amber'
          }`}>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Live RTT Ping
            </span>
            <div className="text-5xl font-extrabold text-white font-mono tabular-nums tracking-tight my-1">
              {currentPoint.ping}
              <span className="text-sm font-normal text-slate-400 ml-1">ms</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-semibold">
              <span className={`w-2 h-2 rounded-full ${isBoosted ? 'bg-cyan-400' : 'bg-amber-400'}`} />
              <span className={isBoosted ? 'text-cyan-300' : 'text-amber-300'}>
                {isBoosted ? 'FASTPATH ACTIVE' : 'UNOPTIMIZED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Glanceable KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 font-mono">
        {/* Packet Loss */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-500">Packet Loss</div>
          <div className={`text-xl font-bold tabular-nums mt-0.5 ${
            currentPoint.packetLoss === 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {currentPoint.packetLoss}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {currentPoint.packetLoss === 0 ? '0 Retransmits' : 'Drops Detected'}
          </div>
        </div>

        {/* Jitter */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-500">Jitter Variance</div>
          <div className="text-xl font-bold text-cyan-300 tabular-nums mt-0.5">
            ±{currentPoint.jitter}ms
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            Bufferbloat: {currentPoint.jitter < 2.5 ? 'A+' : 'A'}
          </div>
        </div>
      </div>

      {/* Big Touch Booster Button */}
      <div>
        {isBoosted ? (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center flex items-center justify-center gap-2 text-xs font-mono text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Optimized with FastPath Low Latency</span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onRevertBoost();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Revert to ISP Routing
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sounds.playSuccess();
              onApplyBoost();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 font-mono"
          >
            <Zap className="w-5 h-5 text-cyan-200" />
            1-TAP FASTPATH BOOST
          </button>
        )}
      </div>
    </div>
  );
};
