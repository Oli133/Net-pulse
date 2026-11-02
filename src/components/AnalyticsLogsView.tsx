import React, { useState } from 'react';
import { TelemetryLogEvent } from '../types/network';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Zap, 
  RotateCw,
  Terminal
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface AnalyticsLogsViewProps {
  logs: TelemetryLogEvent[];
  onClearLogs: () => void;
  currentPing: number;
  currentJitter: number;
  currentLoss: number;
  isBoosted: boolean;
  activeGameName: string;
}

export const AnalyticsLogsView: React.FC<AnalyticsLogsViewProps> = ({
  logs,
  onClearLogs,
  currentPing,
  currentJitter,
  currentLoss,
  isBoosted,
  activeGameName,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'warning' | 'success' | 'info'>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(search.toLowerCase()) || 
                          log.details.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const exportLogsAsJson = () => {
    sounds.playClick();
    const exportData = {
      app: 'NetPulse Gaming Latency Optimizer',
      exportedAt: new Date().toISOString(),
      currentSession: {
        activeGame: activeGameName,
        isBoosted,
        currentPingMs: currentPing,
        currentJitterMs: currentJitter,
        currentPacketLossPercent: currentLoss,
      },
      events: logs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NetPulse_Telemetry_Logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportLogsAsCsv = () => {
    sounds.playClick();
    const headers = 'ID,Timestamp,Severity,Type,Title,Details,PingMs,PacketLoss\n';
    const rows = logs.map(l => 
      `"${l.id}","${l.timestamp}","${l.severity}","${l.type}","${l.title.replace(/"/g, '""')}","${l.details.replace(/"/g, '""')}",${l.pingMs ?? ''},${l.packetLossPercent ?? ''}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NetPulse_Telemetry_Logs_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Network Telemetry & Diagnostic Event Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time inspection of route rerouting events, latency spikes, packet retransmissions, and socket calibrations.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportLogsAsCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 transition-colors flex items-center gap-1.5"
            title="Download CSV log data"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportLogsAsJson}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-xs font-mono text-cyan-300 transition-colors flex items-center gap-1.5"
            title="Download JSON diagnostics file"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClearLogs();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <div className="text-[11px] text-slate-500">Live RTT Latency</div>
          <div className="text-lg font-bold text-white tabular-nums mt-0.5 flex items-baseline gap-1">
            {currentPing} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">
            {isBoosted ? 'FastPath Anycast' : 'Standard ISP'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <div className="text-[11px] text-slate-500">Jitter Variance</div>
          <div className="text-lg font-bold text-cyan-300 tabular-nums mt-0.5 flex items-baseline gap-1">
            ±{currentJitter} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">
            Bufferbloat Grade: {currentJitter < 2.5 ? 'A+' : currentJitter < 8 ? 'A' : 'B'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <div className="text-[11px] text-slate-500">Packet Loss Rate</div>
          <div className={`text-lg font-bold tabular-nums mt-0.5 flex items-baseline gap-1 ${
            currentLoss === 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {currentLoss}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {currentLoss === 0 ? 'Zero Dropped Frames' : 'Retransmissions active'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <div className="text-[11px] text-slate-500">Logged Events</div>
          <div className="text-lg font-bold text-white tabular-nums mt-0.5">
            {logs.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Auto-captured session history
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search event title or message..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        {/* Severity filters */}
        <div className="flex items-center gap-1 text-xs font-mono w-full sm:w-auto overflow-x-auto">
          {(['all', 'warning', 'success', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => {
                sounds.playClick();
                setSeverityFilter(sev);
              }}
              className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching diagnostic events in telemetry buffer.
            </div>
          ) : (
            filteredLogs.map(log => {
              return (
                <div 
                  key={log.id} 
                  className="p-3.5 hover:bg-slate-800/30 transition-colors flex items-start gap-3 text-xs font-mono"
                >
                  {/* Severity icon */}
                  <div className="shrink-0 mt-0.5">
                    {log.severity === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {log.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {log.severity === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {log.severity === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
                  </div>

                  {/* Log body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-semibold text-white truncate">{log.title}</div>
                      <div className="text-[11px] text-slate-500 shrink-0">{log.timestamp}</div>
                    </div>
                    <div className="text-slate-400 text-[11px] leading-relaxed break-words">
                      {log.details}
                    </div>
                  </div>

                  {/* Latency / Loss metric if provided */}
                  {log.pingMs !== undefined && (
                    <div className="shrink-0 text-right font-mono">
                      <span className="text-xs font-bold text-slate-200 tabular-nums">{log.pingMs}ms</span>
                      {log.packetLossPercent !== undefined && (
                        <div className={`text-[10px] ${log.packetLossPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {log.packetLossPercent}% loss
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
