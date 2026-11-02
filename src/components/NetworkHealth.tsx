import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, 
  ArrowDown, 
  ArrowUp, 
  Activity, 
  ShieldCheck, 
  RotateCw, 
  Play, 
  CheckCircle2, 
  Flame, 
  Cpu, 
  Server, 
  Layers,
  Sparkles,
  Wifi
} from 'lucide-react';
import { sounds } from '../utils/audio';

export interface SpeedTestResult {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  loadedLatencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  timestamp: string;
  rating: 'Tournament Grade' | 'Excellent' | 'Good' | 'Fair';
}

interface NetworkHealthProps {
  isBoosted: boolean;
  activeGameName: string;
  serverLocation: string;
  onOptimizeRequested?: () => void;
}

export const NetworkHealth: React.FC<NetworkHealthProps> = ({
  isBoosted,
  activeGameName,
  serverLocation,
  onOptimizeRequested,
}) => {
  type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'complete';

  const [stage, setStage] = useState<TestStage>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentMetricLabel, setCurrentMetricLabel] = useState<string>('Ready');

  // Test results state
  const [result, setResult] = useState<SpeedTestResult>({
    downloadMbps: isBoosted ? 942.5 : 420.2,
    uploadMbps: isBoosted ? 248.8 : 88.4,
    latencyMs: isBoosted ? 14 : 48,
    loadedLatencyMs: isBoosted ? 18 : 94,
    jitterMs: isBoosted ? 0.9 : 6.4,
    packetLossPercent: isBoosted ? 0.0 : 1.8,
    timestamp: 'Baseline Initialized',
    rating: isBoosted ? 'Tournament Grade' : 'Good',
  });

  const animRef = useRef<number | null>(null);

  const runSpeedTest = async () => {
    if (stage !== 'idle' && stage !== 'complete') return;
    sounds.playBoostPulse(380);

    // Stage 1: Ping & Jitter calibration
    setStage('ping');
    setCurrentMetricLabel('Calibrating Ping & Edge Latency...');
    setProgress(5);

    for (let i = 0; i <= 25; i += 2) {
      setProgress(i);
      setCurrentSpeed(Math.round((isBoosted ? 12 : 45) + (Math.random() - 0.5) * 6));
      await new Promise(r => setTimeout(r, 60));
    }
    sounds.playClick();

    // Stage 2: Download Stream
    setStage('download');
    setCurrentMetricLabel('Testing Downstream Bandwidth...');
    const targetDownload = isBoosted ? 920 + Math.random() * 60 : 380 + Math.random() * 80;

    for (let p = 25; p <= 65; p++) {
      setProgress(p);
      const ratio = (p - 25) / 40;
      // ramp curve
      const speedVal = targetDownload * Math.sin((ratio * Math.PI) / 2);
      setCurrentSpeed(Number(speedVal.toFixed(1)));
      await new Promise(r => setTimeout(r, 40));
    }
    sounds.playBoostPulse(520);

    // Stage 3: Upload Stream
    setStage('upload');
    setCurrentMetricLabel('Testing Upstream Buffer & DSCP QoS...');
    const targetUpload = isBoosted ? 230 + Math.random() * 40 : 75 + Math.random() * 25;

    for (let p = 65; p <= 98; p++) {
      setProgress(p);
      const ratio = (p - 65) / 33;
      const speedVal = targetUpload * Math.sin((ratio * Math.PI) / 2);
      setCurrentSpeed(Number(speedVal.toFixed(1)));
      await new Promise(r => setTimeout(r, 45));
    }

    // Complete
    setProgress(100);
    setStage('complete');
    setCurrentMetricLabel('Diagnostic Completed');

    const finalDownload = Number((targetDownload).toFixed(1));
    const finalUpload = Number((targetUpload).toFixed(1));
    const finalLatency = isBoosted ? 14 : 46;
    const finalLoadedLatency = isBoosted ? 18 : 92;
    const finalJitter = Number((isBoosted ? 0.8 + Math.random() * 0.4 : 5.8 + Math.random() * 2.5).toFixed(1));
    const finalLoss = isBoosted ? 0.0 : 1.6;

    setResult({
      downloadMbps: finalDownload,
      uploadMbps: finalUpload,
      latencyMs: finalLatency,
      loadedLatencyMs: finalLoadedLatency,
      jitterMs: finalJitter,
      packetLossPercent: finalLoss,
      timestamp: new Date().toLocaleTimeString(),
      rating: isBoosted ? 'Tournament Grade' : 'Good',
    });

    sounds.playSuccess();
  };

  const bufferbloatDelta = Math.max(0, result.loadedLatencyMs - result.latencyMs);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md space-y-6">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Network Health & Throughput Benchmark</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isBoosted 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold' 
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {isBoosted ? 'FASTPATH PIPELINE' : 'DEFAULT ISP PIPELINE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated bandwidth, loaded bufferbloat latency, and packet transmission capacity testing.
            </p>
          </div>
        </div>

        {/* Speed test trigger button */}
        <button
          onClick={runSpeedTest}
          disabled={stage !== 'idle' && stage !== 'complete'}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] shrink-0"
        >
          {stage === 'idle' || stage === 'complete' ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{stage === 'complete' ? 'Run Test Again' : 'Start Speed Test'}</span>
            </>
          ) : (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Testing ({progress}%)</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar & Phase Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Phase:</span>
            <span className="font-semibold text-cyan-300">
              {stage === 'idle' && 'Idle — Ready to Probe'}
              {stage === 'ping' && '1/3 Probing RTT Latency & Jitter'}
              {stage === 'download' && '2/3 Measuring Downstream Throughput'}
              {stage === 'upload' && '3/3 Measuring Upstream Buffer & DSCP Priority'}
              {stage === 'complete' && 'Test Finished — Metrics Synced'}
            </span>
          </div>
          <span className="text-slate-400 font-bold tabular-nums">{progress}%</span>
        </div>

        {/* Interactive Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-200 relative ${
              stage === 'complete'
                ? 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-300'
                : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400'
            }`}
            style={{ width: `${progress}%` }}
          >
            {stage !== 'idle' && stage !== 'complete' && (
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            )}
          </div>
        </div>

        {/* Phase Indicator Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <div className={`p-2 rounded-lg border text-center transition-colors ${
            stage === 'ping' 
              ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30' 
              : progress > 25 
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            1. Latency & Jitter
          </div>
          <div className={`p-2 rounded-lg border text-center transition-colors ${
            stage === 'download' 
              ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30' 
              : progress > 65 
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            2. Download Bandwidth
          </div>
          <div className={`p-2 rounded-lg border text-center transition-colors ${
            stage === 'upload' 
              ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30' 
              : progress === 100 
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            3. Upload & QoS Tagging
          </div>
        </div>
      </div>

      {/* Active Meter Display during execution */}
      {stage !== 'idle' && stage !== 'complete' && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-center space-y-1 glow-cyan">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            {currentMetricLabel}
          </div>
          <div className="text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {currentSpeed}
            <span className="text-sm font-normal text-slate-400 ml-1.5">
              {stage === 'ping' ? 'ms' : 'Mbps'}
            </span>
          </div>
        </div>
      )}

      {/* Summary Dashboard Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Speed & Network Health Summary
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Last tested: {result.timestamp}
          </span>
        </div>

        {/* Summary Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {/* Download Speed Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <ArrowDown className="w-3.5 h-3.5 text-cyan-400" /> Download
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                Fast
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1 tabular-nums flex items-baseline gap-1">
              {result.downloadMbps}
              <span className="text-xs font-normal text-slate-400">Mbps</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Downstream payload capacity
            </div>
          </div>

          {/* Upload Speed Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> Upload
              </span>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                Synchronized
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1 tabular-nums flex items-baseline gap-1">
              {result.uploadMbps}
              <span className="text-xs font-normal text-slate-400">Mbps</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Input dispatch & stream throughput
            </div>
          </div>

          {/* Latency (Unloaded vs Loaded) */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Latency RTT
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                bufferbloatDelta < 10 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                +{bufferbloatDelta}ms Loaded
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1 tabular-nums flex items-baseline gap-1">
              {result.latencyMs}
              <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Loaded: <span className="text-slate-300 font-semibold">{result.loadedLatencyMs}ms</span>
            </div>
          </div>

          {/* Jitter & Integrity Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Jitter & Loss
              </span>
              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                {result.packetLossPercent}% Loss
              </span>
            </div>
            <div className="text-2xl font-bold text-cyan-300 mt-1 tabular-nums flex items-baseline gap-1">
              ±{result.jitterMs}
              <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Rating: <span className="text-emerald-400 font-semibold">{result.rating}</span>
            </div>
          </div>
        </div>

        {/* Gaming Suitability Breakdown */}
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">
                Competitive Suitability: {result.rating} ({activeGameName})
              </span>
              <p className="text-[11px] text-slate-400">
                Network connection supports high-tickrate competitive gaming (128-tick CS2 & Valorant) with zero choke.
              </p>
            </div>
          </div>

          {!isBoosted && onOptimizeRequested && (
            <button
              onClick={() => {
                sounds.playSuccess();
                onOptimizeRequested();
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span>Engage FastPath Boost</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
