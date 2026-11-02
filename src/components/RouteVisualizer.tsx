import React, { useState } from 'react';
import { NetworkHop } from '../types/network';
import { DEFAULT_HOPS_ISP, DEFAULT_HOPS_BOOSTED } from '../data/gamingData';
import { Route, ShieldAlert, ArrowRight, CheckCircle2, Globe, Cpu, Server } from 'lucide-react';

interface RouteVisualizerProps {
  isBoosted: boolean;
  gameServerName: string;
}

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({
  isBoosted,
  gameServerName,
}) => {
  const [selectedTab, setSelectedTab] = useState<'optimized' | 'isp'>(isBoosted ? 'optimized' : 'isp');

  // Keep tab in sync when booster status changes
  React.useEffect(() => {
    setSelectedTab(isBoosted ? 'optimized' : 'isp');
  }, [isBoosted]);

  const activeHops: NetworkHop[] = selectedTab === 'optimized' ? DEFAULT_HOPS_BOOSTED : DEFAULT_HOPS_ISP;

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
      {/* Header with Route Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">Packet Route Architecture & Hops</h3>
            <p className="text-xs text-slate-400">
              Traceroute inspection to <span className="text-slate-200">{gameServerName}</span>
            </p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono">
          <button
            onClick={() => setSelectedTab('optimized')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              selectedTab === 'optimized'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>NetPulse FastPath (4 Hops)</span>
          </button>
          <button
            onClick={() => setSelectedTab('isp')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              selectedTab === 'isp'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Default ISP (7 Hops)</span>
          </button>
        </div>
      </div>

      {/* Visual Route Pipeline Nodes */}
      <div className="p-3 mb-4 rounded-lg bg-slate-950/60 border border-slate-800/80 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[540px] text-xs font-mono">
          {/* Node 1: Client PC */}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-white">Your PC</span>
            <span className="text-[10px] text-slate-500">NIC 0.2ms</span>
          </div>

          <div className="flex-1 flex items-center justify-center px-2">
            <div className={`h-0.5 w-full ${selectedTab === 'optimized' ? 'bg-cyan-500/60' : 'bg-slate-700'} relative`}>
              <ArrowRight className={`w-3.5 h-3.5 absolute right-0 -top-1.5 ${selectedTab === 'optimized' ? 'text-cyan-400' : 'text-slate-500'}`} />
            </div>
          </div>

          {/* Node 2: Local Gateway */}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              selectedTab === 'optimized'
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-white">Home Gateway</span>
            <span className="text-[10px] text-slate-400">192.168.1.1</span>
          </div>

          <div className="flex-1 flex items-center justify-center px-2">
            <div className={`h-0.5 w-full ${selectedTab === 'optimized' ? 'bg-cyan-500/60' : 'bg-amber-500/60'} relative`}>
              <ArrowRight className={`w-3.5 h-3.5 absolute right-0 -top-1.5 ${selectedTab === 'optimized' ? 'text-cyan-400' : 'text-amber-400'}`} />
            </div>
          </div>

          {/* Node 3: Transit / Ingress */}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              selectedTab === 'optimized'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <Route className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-white">
              {selectedTab === 'optimized' ? 'Anycast FastPath' : 'Public ISP Transit'}
            </span>
            <span className={`text-[10px] ${selectedTab === 'optimized' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {selectedTab === 'optimized' ? 'Direct Peering' : '4 Congested Hops'}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center px-2">
            <div className={`h-0.5 w-full ${selectedTab === 'optimized' ? 'bg-cyan-500/60' : 'bg-amber-500/60'} relative`}>
              <ArrowRight className={`w-3.5 h-3.5 absolute right-0 -top-1.5 ${selectedTab === 'optimized' ? 'text-cyan-400' : 'text-amber-400'}`} />
            </div>
          </div>

          {/* Node 4: Game Server */}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-white">Game Server</span>
            <span className="text-[10px] text-cyan-300">{selectedTab === 'optimized' ? '19.3ms Final' : '64.7ms Final'}</span>
          </div>
        </div>
      </div>

      {/* Traceroute Hop Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="pb-2 font-medium w-12">Hop</th>
              <th className="pb-2 font-medium">Hostname / IP</th>
              <th className="pb-2 font-medium">Location</th>
              <th className="pb-2 font-medium">Routing ASN</th>
              <th className="pb-2 font-medium text-right">RTT</th>
              <th className="pb-2 font-medium text-right">Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {activeHops.map((hop) => (
              <tr 
                key={hop.hopNumber} 
                className={`hover:bg-slate-800/40 transition-colors ${
                  hop.lossPercent > 1.0 ? 'bg-amber-500/5' : ''
                }`}
              >
                <td className="py-2 text-slate-400 font-bold">#{hop.hopNumber}</td>
                <td className="py-2 text-slate-200">
                  <div className="font-semibold truncate max-w-[200px]">{hop.host}</div>
                  <div className="text-[10px] text-slate-500">{hop.ip}</div>
                </td>
                <td className="py-2 text-slate-400">{hop.location}</td>
                <td className="py-2 text-slate-500 text-[11px]">{hop.asn}</td>
                <td className="py-2 text-right font-semibold tabular-nums text-slate-200">
                  {hop.latencyMs} ms
                </td>
                <td className="py-2 text-right tabular-nums">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    hop.lossPercent === 0 
                      ? 'text-emerald-400 bg-emerald-500/10' 
                      : 'text-amber-400 bg-amber-500/10'
                  }`}>
                    {hop.lossPercent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
