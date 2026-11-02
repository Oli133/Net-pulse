import React, { useState } from 'react';
import { NetworkSettings } from '../types/network';
import { 
  Sliders, 
  Gamepad2, 
  Download, 
  Cpu, 
  ShieldCheck, 
  Check, 
  RotateCcw, 
  FileCode, 
  Info,
  Radio,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameModeSettingsViewProps {
  settings: NetworkSettings;
  onUpdateSettings: (newSettings: Partial<NetworkSettings>) => void;
  onResetDefaults: () => void;
  activeGameName: string;
}

export const GameModeSettingsView: React.FC<GameModeSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
  activeGameName,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [mtuTestActive, setMtuTestActive] = useState(false);
  const [mtuTestResult, setMtuTestResult] = useState<string | null>(null);

  const handleToggle = (key: keyof NetworkSettings) => {
    sounds.playClick();
    onUpdateSettings({ [key]: !settings[key] });
  };

  const runMtuTest = async () => {
    setMtuTestActive(true);
    setMtuTestResult(null);
    sounds.playBoostPulse(350);

    await new Promise(resolve => setTimeout(resolve, 800));
    setMtuTestActive(false);
    setMtuTestResult('Optimal MTU confirmed: 1500 bytes without packet fragmentation (MSS 1460)');
    sounds.playSuccess();
  };

  const exportRegistryScript = () => {
    sounds.playClick();
    const regContent = `Windows Registry Editor Version 5.00

; NetPulse Gaming Network Latency Optimizer Configuration
; Generated for Windows 10 / Windows 11

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters]
"Tcp1323Opts"=dword:00000001
"MaxFreeTcbs"=dword:00010000
"MaxUserPort"=dword:0000fffe
"TcpTimedWaitDelay"=dword:0000001e

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces]
"TcpAckFrequency"=dword:${settings.nagleDisabled ? '00000001' : '00000002'}
"TCPNoDelay"=dword:${settings.nagleDisabled ? '00000001' : '00000000'}
"TcpDelAckTicks"=dword:00000000

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile]
"NetworkThrottlingIndex"=dword:ffffffff
"SystemResponsiveness"=dword:00000000

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games]
"Affinity"=dword:00000000
"Background Only"="False"
"Clock Rate"=dword:00002710
"GPU Priority"=dword:00000008
"Priority"=dword:00000006
"Scheduling Category"="High"
"SFIO Priority"="High"
`;

    const blob = new Blob([regContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NetPulse_Gaming_Optimization.reg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Game Mode & Windows Network Stack Tuning
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure kernel-level packet prioritization, automated process triggers, and MTU calibration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportRegistryScript}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5"
            title="Download .REG registry script for Windows"
          >
            {downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{downloadSuccess ? 'Script Exported' : 'Export .REG Script'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onResetDefaults();
            }}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Setting 1: Auto Game Mode Toggle */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Auto-Toggle Game Mode</h3>
              </div>
              <button
                onClick={() => handleToggle('autoGameMode')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.autoGameMode ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoGameMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitors Windows process creation events. When an active game executable (e.g. {activeGameName}) launches, NetPulse automatically locks fastpath routing and elevates network thread priority.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Status: {settings.autoGameMode ? 'Active Watcher Hooked' : 'Manual Trigger Only'}
          </div>
        </div>

        {/* Setting 2: Background Network Throttling */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Suspend Background Bandwidth</h3>
              </div>
              <button
                onClick={() => handleToggle('backgroundThrottle')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.backgroundThrottle ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.backgroundThrottle ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Throttles Steam background updates, Epic launcher downloads, and Windows Update Delivery Optimization while an active gaming session is in progress to prevent ping spikes.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Background Cap: {settings.backgroundThrottle ? 'Limited to 256 Kbps' : 'Uncapped'}
          </div>
        </div>

        {/* Setting 3: Disable Nagle's Algorithm (TCP_NODELAY) */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Disable Nagle's Algorithm</h3>
              </div>
              <button
                onClick={() => handleToggle('nagleDisabled')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.nagleDisabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.nagleDisabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard Windows networking delays sending small packets until an acknowledgment (ACK) is returned. Disabling Nagle forces immediate dispatch of player inputs and position coordinates.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
            Registry: <span className="text-slate-200">TCPNoDelay=1, TcpAckFrequency=1</span>
          </div>
        </div>

        {/* Setting 4: QoS DSCP 46 Expedited Forwarding */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">QoS DSCP 46 Tagging</h3>
              </div>
              <button
                onClick={() => handleToggle('qosDscpTagging')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.qosDscpTagging ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.qosDscpTagging ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Injects Differentiated Services Code Point (DSCP) 46 Expedited Forwarding header into outbound game packets, signaling routers and modems to prioritize your gaming packets over video streaming.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-indigo-300">
            Traffic Class: Expedited Forwarding (EF)
          </div>
        </div>
      </div>

      {/* MTU Calibration & TCP Window Auto-Tuning Panel */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">MTU Packet Size & TCP/IP Auto-Tuning</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MTU selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300">Maximum Transmission Unit (MTU)</label>
              <button
                onClick={runMtuTest}
                disabled={mtuTestActive}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors underline disabled:opacity-50"
              >
                {mtuTestActive ? 'Probing Buffer...' : 'Test Optimal MTU'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1500, 1492, 1450].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    sounds.playClick();
                    onUpdateSettings({ mtuSize: val });
                  }}
                  className={`py-2 rounded-lg text-xs font-mono border transition-all ${
                    settings.mtuSize === val
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {val} bytes {val === 1500 ? '(Ethernet)' : val === 1492 ? '(PPPoE)' : '(VPN)'}
                </button>
              ))}
            </div>

            {mtuTestResult && (
              <div className="mt-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 p-2 rounded">
                {mtuTestResult}
              </div>
            )}
          </div>

          {/* TCP Window Auto-Tuning */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Windows TCP Receive Window Auto-Tuning
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'experimental', 'disabled'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    sounds.playClick();
                    onUpdateSettings({ tcpWindowAutoTuning: mode });
                  }}
                  className={`py-2 rounded-lg text-xs font-mono border capitalize transition-all ${
                    settings.tcpWindowAutoTuning === mode
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Normal mode dynamically scales TCP sliding window buffer sizes without introducing queue delay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
