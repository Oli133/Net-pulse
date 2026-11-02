import React, { useState } from 'react';
import { DnsProvider } from '../types/network';
import { 
  Globe2, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  Play, 
  ShieldCheck, 
  RotateCw, 
  Check, 
  SlidersHorizontal,
  Flame,
  Lock
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface DnsCustomizationViewProps {
  dnsProviders: DnsProvider[];
  activeDnsId: string;
  onApplyDns: (providerId: string) => void;
  onApplyCustomDns: (primary: string, secondary: string, doh: boolean) => void;
  customPrimary: string;
  customSecondary: string;
  dnsOverHttps: boolean;
  onFlushDnsCache: () => void;
}

export const DnsCustomizationView: React.FC<DnsCustomizationViewProps> = ({
  dnsProviders: initialProviders,
  activeDnsId,
  onApplyDns,
  onApplyCustomDns,
  customPrimary: initPrimary,
  customSecondary: initSecondary,
  dnsOverHttps: initDoh,
  onFlushDnsCache,
}) => {
  const [providers, setProviders] = useState<DnsProvider[]>(initialProviders);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkedFastestId, setBenchmarkedFastestId] = useState<string | null>(null);
  const [customPrimary, setCustomPrimary] = useState(initPrimary);
  const [customSecondary, setCustomSecondary] = useState(initSecondary);
  const [dohEnabled, setDohEnabled] = useState(initDoh);
  const [flushingCache, setFlushingCache] = useState(false);
  const [flushSuccess, setFlushSuccess] = useState(false);

  // Run DNS Speed Benchmark across all servers
  const runBenchmark = async () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    sounds.playBoostPulse(300);

    // Reset latencies to testing state
    const testingState: DnsProvider[] = providers.map(p => ({
      ...p,
      isTesting: true,
      latencyMs: null,
    }));
    setProviders(testingState);

    const updated = [...testingState];

    for (let i = 0; i < updated.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 350 + Math.random() * 200));
      sounds.playClick();

      // Realistic resolution latencies
      let lat = 9;
      if (updated[i].id === 'cloudflare') lat = Math.floor(7 + Math.random() * 4);
      else if (updated[i].id === 'google') lat = Math.floor(12 + Math.random() * 5);
      else if (updated[i].id === 'quad9') lat = Math.floor(15 + Math.random() * 6);
      else if (updated[i].id === 'opendns') lat = Math.floor(19 + Math.random() * 5);
      else if (updated[i].id === 'adguard') lat = Math.floor(21 + Math.random() * 6);

      updated[i] = {
        ...updated[i],
        isTesting: false,
        latencyMs: lat,
      };
      setProviders([...updated]);
    }

    // Find the fastest provider
    const sorted = [...updated].sort((a, b) => (a.latencyMs || 999) - (b.latencyMs || 999));
    const fastest = sorted[0];
    setBenchmarkedFastestId(fastest.id);
    setIsBenchmarking(false);
    sounds.playSuccess();
  };

  const handleFlushCache = async () => {
    setFlushingCache(true);
    sounds.playBoostPulse(500);
    await new Promise(resolve => setTimeout(resolve, 600));
    setFlushingCache(false);
    setFlushSuccess(true);
    sounds.playSuccess();
    onFlushDnsCache();
    setTimeout(() => setFlushSuccess(false), 3000);
  };

  const activeProvider = providers.find(p => p.id === activeDnsId);

  return (
    <div className="space-y-6">
      {/* View Title & Cache Flush */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            DNS Acceleration & Anycast Resolution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reduce initial match connection handshake latency and packet transit jitter with gaming-optimized Anycast DNS.
          </p>
        </div>

        {/* Flush DNS button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFlushCache}
            disabled={flushingCache}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-colors flex items-center gap-2"
          >
            {flushingCache ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : flushSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{flushSuccess ? 'DNS Cache Purged' : 'Flush DNS Resolver'}</span>
          </button>

          <button
            onClick={runBenchmark}
            disabled={isBenchmarking}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs tracking-wide shadow-md shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isBenchmarking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isBenchmarking ? 'Testing Resolvers...' : 'Benchmark DNS Speed'}</span>
          </button>
        </div>
      </div>

      {/* Active DNS Banner */}
      {activeProvider && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Active Adapter DNS: {activeProvider.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  APPLIED
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Primary: <span className="text-cyan-300 font-semibold">{activeProvider.primary}</span> · Secondary: <span className="text-cyan-300 font-semibold">{activeProvider.secondary}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Query Latency</div>
              <div className="text-emerald-400 font-bold tabular-nums">
                {activeProvider.latencyMs ? `${activeProvider.latencyMs} ms` : '9 ms'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DNS Benchmark Result Suggestion */}
      {benchmarkedFastestId && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>
              Benchmark Complete: <strong>{providers.find(p => p.id === benchmarkedFastestId)?.name}</strong> recorded the lowest response time.
            </span>
          </div>
          {activeDnsId !== benchmarkedFastestId && (
            <button
              onClick={() => {
                sounds.playSuccess();
                onApplyDns(benchmarkedFastestId);
              }}
              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400 transition-colors"
            >
              Apply Fastest
            </button>
          )}
        </div>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map(provider => {
          const isActive = provider.id === activeDnsId;
          const isFastest = provider.id === benchmarkedFastestId;

          return (
            <div
              key={provider.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-slate-900/90 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {provider.name}
                      {isFastest && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          FASTEST
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{provider.provider}</div>
                  </div>

                  {/* Benchmark latency */}
                  <div className="font-mono text-right shrink-0">
                    {provider.isTesting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : provider.latencyMs !== null ? (
                      <span className={`text-xs font-bold tabular-nums ${provider.latencyMs < 12 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {provider.latencyMs} ms
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">--</span>
                    )}
                  </div>
                </div>

                {/* IP boxes */}
                <div className="my-3 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/70 rounded border border-slate-800/80">
                    <span className="text-slate-500">Primary</span>
                    <span className="text-slate-200 font-semibold">{provider.primary}</span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/70 rounded border border-slate-800/80">
                    <span className="text-slate-500">Secondary</span>
                    <span className="text-slate-400">{provider.secondary}</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {provider.features.map(f => (
                    <span key={f} className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  sounds.playSuccess();
                  onApplyDns(provider.id);
                }}
                disabled={isActive}
                className={`w-full py-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Active Adapter DNS</span>
                  </>
                ) : (
                  <span>Apply DNS to Adapter</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom DNS Form Section */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Manual DNS Server Override</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={dohEnabled}
                onChange={e => setDohEnabled(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Enable DNS-over-HTTPS (DoH Encrypted)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Custom Primary IPv4 or IPv6</label>
            <input
              type="text"
              value={customPrimary}
              onChange={e => setCustomPrimary(e.target.value)}
              placeholder="e.g. 1.1.1.1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Custom Secondary IPv4 or IPv6</label>
            <input
              type="text"
              value={customSecondary}
              onChange={e => setCustomSecondary(e.target.value)}
              placeholder="e.g. 1.0.0.1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              sounds.playSuccess();
              onApplyCustomDns(customPrimary, customSecondary, dohEnabled);
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-white transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Apply Custom Static DNS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
