import React, { useState } from 'react';
import { 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  Loader2, 
  Flame, 
  ArrowDownRight, 
  ShieldCheck, 
  Cpu, 
  Network
} from 'lucide-react';
import { OPTIMIZATION_PIPELINE } from '../services/networkSimulator';
import { OptimizationStep } from '../types/network';
import { sounds } from '../utils/audio';

interface OneClickBoosterProps {
  isBoosted: boolean;
  onApplyBoost: () => void;
  onRevertBoost: () => void;
  baselinePing: number;
  boostedPing: number;
  activeGameName: string;
}

export const OneClickBooster: React.FC<OneClickBoosterProps> = ({
  isBoosted,
  onApplyBoost,
  onRevertBoost,
  baselinePing,
  boostedPing,
  activeGameName,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [steps, setSteps] = useState<OptimizationStep[]>(
    OPTIMIZATION_PIPELINE.map(step => ({ ...step, status: 'pending' }))
  );
  const [progressPercent, setProgressPercent] = useState(0);

  const startOptimization = async () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setProgressPercent(5);
    sounds.playBoostPulse(350);

    const updatedSteps: OptimizationStep[] = OPTIMIZATION_PIPELINE.map(step => ({
      ...step,
      status: 'pending',
    }));
    setSteps(updatedSteps);

    for (let i = 0; i < updatedSteps.length; i++) {
      setCurrentStepIndex(i);
      updatedSteps[i].status = 'active';
      setSteps([...updatedSteps]);
      sounds.playBoostPulse(420 + i * 60);

      const stepProgress = Math.round(((i + 0.5) / updatedSteps.length) * 100);
      setProgressPercent(stepProgress);

      await new Promise(resolve => setTimeout(resolve, updatedSteps[i].durationMs));

      updatedSteps[i].status = 'completed';
      setSteps([...updatedSteps]);
      setProgressPercent(Math.round(((i + 1) / updatedSteps.length) * 100));
    }

    sounds.playSuccess();
    setIsOptimizing(false);
    setCurrentStepIndex(-1);
    onApplyBoost();
  };

  const latencyDropMs = Math.max(0, baselinePing - boostedPing);
  const latencyDropPercent = Math.round((latencyDropMs / baselinePing) * 100);

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden backdrop-blur-md shadow-lg">
      {/* Background neon ambient highlight */}
      <div className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        isBoosted ? 'bg-cyan-500/15' : isOptimizing ? 'bg-blue-500/20' : 'bg-slate-700/10'
      }`} />

      {/* Top Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isBoosted ? 'text-cyan-400' : 'text-slate-400'}`} />
              Instant Route Optimization Engine
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
              isBoosted 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isBoosted ? 'ACTIVE ACCELERATION' : 'IDLE / DEFAULT ISP'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-negotiates low-latency transit, clears network bufferbloat, and binds priority gaming QoS tags.
          </p>
        </div>

        {/* Latency Comparison Pill */}
        <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-1.5 shrink-0 font-mono">
          <div className="text-center">
            <div className="text-[10px] text-slate-400">Baseline ISP</div>
            <div className="text-sm font-bold text-amber-400 tabular-nums">{baselinePing}ms</div>
          </div>
          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          <div className="text-center">
            <div className="text-[10px] text-slate-400">Optimized</div>
            <div className="text-sm font-bold text-cyan-300 tabular-nums">{boostedPing}ms</div>
          </div>
          <div className="text-[10px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/25">
            -{latencyDropPercent}%
          </div>
        </div>
      </div>

      {/* Main Interactive Button / Sequence Display */}
      {!isOptimizing && !isBoosted && (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 glow-cyan">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-sm font-semibold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Ready to Accelerate: {activeGameName}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              One click tunes Windows TCP/IP registry, forces TCP_NODELAY, and redirects payload to Anycast FastPath.
            </p>
          </div>

          <button
            onClick={startOptimization}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 group whitespace-nowrap active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
            BOOST NOW (1-CLICK)
          </button>
        </div>
      )}

      {/* Optimizing State (Live Stepper Modal/Banner) */}
      {isOptimizing && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 glow-cyan flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>TUNING WINDOWS NETWORK STACK ({progressPercent}%)</span>
            </div>
            <span className="text-slate-400">Step {currentStepIndex + 1} of {steps.length}</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Active Step details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`p-2 rounded-lg border text-xs font-mono transition-all flex items-start gap-2 ${
                  step.status === 'completed'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : step.status === 'active'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
                }`}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : step.status === 'active' ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0 mt-0.5 text-[9px] flex items-center justify-center text-slate-500">
                    {idx + 1}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold truncate">{step.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boosted State (Active Optimization Feedback) */}
      {!isOptimizing && isBoosted && (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 glow-emerald flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>FastPath Tier-1 Backbone Active</span>
                <span className="text-[10px] font-mono px-2 py-0.2 text-emerald-300 bg-emerald-500/20 rounded border border-emerald-500/30">
                  0.0% LOSS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                Gaming packets routed via private low-latency Anycast node · Nagle's TCP_NODELAY locked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                sounds.playClick();
                startOptimization();
              }}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              title="Re-run calibration sequence"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-calibrate
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onRevertBoost();
              }}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-mono font-medium border border-red-500/30 transition-colors flex items-center justify-center gap-1.5"
              title="Revert back to default ISP public routing"
            >
              Revert to ISP
            </button>
          </div>
        </div>
      )}

      {/* Quick Feature Badges Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>Anycast Direct Peering</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>MMCSS Priority Affinity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>TCP_NODELAY Activated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>DSCP 46 Expedited QoS</span>
        </div>
      </div>
    </div>
  );
};
