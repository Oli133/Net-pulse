import React, { useState, useEffect, useRef } from 'react';
import { 
  GameProfile, 
  TelemetryPoint, 
  NetworkSettings, 
  TelemetryLogEvent, 
  DnsProvider 
} from './types/network';
import { 
  INITIAL_GAMES, 
  INITIAL_DNS_PROVIDERS 
} from './data/gamingData';
import { 
  generateNextTelemetryPoint, 
  createInitialTelemetryHistory, 
  calculateJitter 
} from './services/networkSimulator';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { DashboardView } from './components/DashboardView';
import { GamesView } from './components/GamesView';
import { DnsCustomizationView } from './components/DnsCustomizationView';
import { GameModeSettingsView } from './components/GameModeSettingsView';
import { AnalyticsLogsView } from './components/AnalyticsLogsView';
import { MobileCompanionView } from './components/MobileCompanionView';
import { NetworkHealth } from './components/NetworkHealth';
import { sounds } from './utils/audio';

import { 
  LayoutDashboard, 
  Gamepad2, 
  Globe2, 
  Sliders, 
  FileText, 
  Zap, 
  Wifi, 
  BellRing,
  RotateCw,
  X,
  Gauge
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'health' | 'games' | 'dns' | 'settings' | 'logs'>('dashboard');
  const [isMobileCompanionMode, setIsMobileCompanionMode] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [trayNotification, setTrayNotification] = useState<string | null>(null);

  // Sound enable
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Games & Routing
  const [games, setGames] = useState<GameProfile[]>(INITIAL_GAMES);
  const [activeGameId, setActiveGameId] = useState<string>('valorant');

  // DNS Providers
  const [dnsProviders, setDnsProviders] = useState<DnsProvider[]>(INITIAL_DNS_PROVIDERS);

  // Settings
  const [settings, setSettings] = useState<NetworkSettings>({
    isBoostActive: true,
    autoGameMode: true,
    gameModeActive: true,
    nagleDisabled: true,
    qosDscpTagging: true,
    mtuSize: 1500,
    tcpWindowAutoTuning: 'normal',
    backgroundThrottle: true,
    multipathRouting: true,
    soundEffects: true,
    activeDnsId: 'cloudflare',
    customDnsPrimary: '1.1.1.1',
    customDnsSecondary: '1.0.0.1',
    dnsOverHttps: true,
  });

  const activeGame = games.find(g => g.id === activeGameId) || games[0];
  const activeServer = activeGame.servers.find(s => s.id === activeGame.selectedServerId) || activeGame.servers[0];

  // Telemetry Stream State
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => 
    createInitialTelemetryHistory(settings.isBoostActive, activeServer.baselinePing, activeServer.boostedPing, 60)
  );

  const [currentPoint, setCurrentPoint] = useState<TelemetryPoint>(() => telemetryHistory[telemetryHistory.length - 1]);

  // Analytics Diagnostic Event Logs
  const [logs, setLogs] = useState<TelemetryLogEvent[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 50000).toLocaleTimeString(),
      type: 'process',
      severity: 'info',
      title: 'Windows Process Watcher Initialized',
      details: 'Hooked to Windows Win32 Process Creation API. Monitoring game executables.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 42000).toLocaleTimeString(),
      type: 'dns',
      severity: 'success',
      title: 'Cloudflare WARP Anycast DNS Bound',
      details: 'Adapter configured to 1.1.1.1 / 1.0.0.1 with DoH encapsulation active.',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      type: 'boost',
      severity: 'success',
      title: 'FastPath Route Established for VALORANT',
      details: 'Direct Anycast tunnel mapped to Ashburn VA Riot Direct Datacenter. Latency reduced to 19ms.',
      pingMs: 19,
      packetLossPercent: 0,
    },
  ]);

  // Sound sync
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Auto Game Mode watcher: if a game is running and autoGameMode is enabled, ensure boost & game mode are engaged!
  useEffect(() => {
    const runningGame = games.find(g => g.isRunning);
    if (runningGame && settings.autoGameMode) {
      if (!settings.isBoostActive || !settings.gameModeActive) {
        setSettings(prev => ({ ...prev, isBoostActive: true, gameModeActive: true }));
        addLogEvent({
          type: 'process',
          severity: 'success',
          title: `Auto Game Mode Engaged: ${runningGame.name}`,
          details: `Detected active process ${runningGame.exeName}. FastPath routing and MMCSS priority engaged.`,
        });
        showNotification(`Auto Game Mode: ${runningGame.name} optimized`);
      }
    } else if (!runningGame && settings.gameModeActive) {
      setSettings(prev => ({ ...prev, gameModeActive: false }));
    }
  }, [games, settings.autoGameMode]);

  // Telemetry stream generator tick (1000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryHistory(prev => {
        const next = generateNextTelemetryPoint(
          prev[prev.length - 1],
          settings.isBoostActive,
          activeServer.baselinePing,
          activeServer.boostedPing
        );

        setCurrentPoint(next);

        // Random jitter spike warning log when on default unboosted route
        if (!settings.isBoostActive && next.ping > activeServer.baselinePing + 20) {
          addLogEvent({
            type: 'warning',
            severity: 'warning',
            title: 'Congestion Spike on Public ISP Hop',
            details: `Transit packet delay jumped to ${next.ping}ms with ${next.packetLoss}% packet loss.`,
            pingMs: next.ping,
            packetLossPercent: next.packetLoss,
          });
        }

        const updated = [...prev.slice(1), next];
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.isBoostActive, activeServer]);

  // Log event helper
  const addLogEvent = (event: Omit<TelemetryLogEvent, 'id' | 'timestamp'>) => {
    const newLog: TelemetryLogEvent = {
      ...event,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  // Toast / System notification helper
  const showNotification = (msg: string) => {
    setTrayNotification(msg);
    setTimeout(() => {
      setTrayNotification(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  // Apply One-Click Boost action
  const handleApplyBoost = () => {
    setSettings(prev => ({ ...prev, isBoostActive: true }));
    addLogEvent({
      type: 'boost',
      severity: 'success',
      title: 'One-Click Network Stack Optimization Completed',
      details: 'TCP_NODELAY enabled, MTU 1500 locked, DSCP 46 marked, Anycast FastPath connected.',
      pingMs: activeServer.boostedPing,
      packetLossPercent: 0,
    });
    showNotification('System Accelerated: FastPath Route Active');
  };

  // Revert Boost action
  const handleRevertBoost = () => {
    setSettings(prev => ({ ...prev, isBoostActive: false }));
    addLogEvent({
      type: 'route',
      severity: 'warning',
      title: 'Routing Reverted to Standard ISP Gateway',
      details: 'FastPath tunnel disconnected. Packets now traversing public carrier exchanges.',
      pingMs: activeServer.baselinePing,
      packetLossPercent: 1.8,
    });
    showNotification('Reverted to Standard ISP Route');
  };

  // Switch Game
  const handleSelectGame = (gameId: string) => {
    setActiveGameId(gameId);
    const game = games.find(g => g.id === gameId);
    if (game) {
      addLogEvent({
        type: 'route',
        severity: 'info',
        title: `Target Game Switched: ${game.name}`,
        details: `Loaded socket parameters: ${game.defaultPort} (${game.protocol}).`,
      });
    }
  };

  // Switch Game Server
  const handleSelectServerRegion = (gameId: string, serverId: string) => {
    setGames(prev =>
      prev.map(g => (g.id === gameId ? { ...g, selectedServerId: serverId } : g))
    );
    const targetGame = games.find(g => g.id === gameId);
    const targetServer = targetGame?.servers.find(s => s.id === serverId);
    if (targetServer) {
      addLogEvent({
        type: 'route',
        severity: 'info',
        title: `Server Region Selected: ${targetServer.name}`,
        details: `Target Datacenter: ${targetServer.location} (${targetServer.serverIp}).`,
      });
    }
  };

  // Toggle Simulated Running Game Process
  const handleToggleGameRunning = (gameId: string) => {
    setGames(prev =>
      prev.map(g => (g.id === gameId ? { ...g, isRunning: !g.isRunning } : g))
    );
  };

  // DNS Apply
  const handleApplyDns = (providerId: string) => {
    setSettings(prev => ({ ...prev, activeDnsId: providerId }));
    const provider = dnsProviders.find(p => p.id === providerId);
    if (provider) {
      addLogEvent({
        type: 'dns',
        severity: 'success',
        title: `DNS Resolver Swapped: ${provider.name}`,
        details: `Primary DNS: ${provider.primary}, Secondary DNS: ${provider.secondary}.`,
      });
      showNotification(`DNS Applied: ${provider.name}`);
    }
  };

  // Custom DNS Apply
  const handleApplyCustomDns = (primary: string, secondary: string, doh: boolean) => {
    setSettings(prev => ({
      ...prev,
      customDnsPrimary: primary,
      customDnsSecondary: secondary,
      dnsOverHttps: doh,
      activeDnsId: 'custom',
    }));
    addLogEvent({
      type: 'dns',
      severity: 'success',
      title: 'Custom DNS Static Override Applied',
      details: `Primary: ${primary}, Secondary: ${secondary}, DoH Encrypted: ${doh ? 'Enabled' : 'Disabled'}.`,
    });
    showNotification('Custom DNS Applied to Network Adapter');
  };

  // Flush DNS Cache
  const handleFlushDnsCache = () => {
    addLogEvent({
      type: 'dns',
      severity: 'info',
      title: 'Windows DNS Resolver Cache Purged',
      details: 'Executed ipconfig /flushdns. NetBIOS name cache and ARP entries refreshed.',
    });
    showNotification('DNS Resolver Cache Cleared');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 select-none">
      {/* Toast Notification Banner */}
      {trayNotification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-cyan-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-mono text-xs backdrop-blur-md">
          <BellRing className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span>{trayNotification}</span>
          <button 
            onClick={() => setTrayNotification(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container Frame (Windows Desktop Utility Style) */}
      <div className={`w-full flex flex-col bg-slate-950 border border-slate-800/90 shadow-2xl transition-all duration-300 ${
        isMaximized 
          ? 'max-w-7xl min-h-screen sm:min-h-[92vh] sm:rounded-2xl overflow-hidden' 
          : 'max-w-5xl min-h-[700px] sm:rounded-xl overflow-hidden my-auto'
      }`}>
        {/* Windows 11 Desktop Title Bar */}
        <WindowsTitleBar
          isBoosted={settings.isBoostActive}
          gameModeActive={settings.gameModeActive}
          activeGameName={activeGame.name}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(prev => !prev)}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(prev => !prev)}
          onMinimize={() => {
            showNotification('NetPulse minimized to Windows Taskbar');
          }}
          onClose={() => {
            showNotification('NetPulse active in Windows System Tray');
          }}
          mobileCompanionMode={isMobileCompanionMode}
          onToggleMobileCompanion={() => setIsMobileCompanionMode(prev => !prev)}
        />

        {/* If Mobile Desk HUD view is active */}
        {isMobileCompanionMode ? (
          <div className="flex-1 flex items-center justify-center bg-slate-950 p-4">
            <MobileCompanionView
              currentPoint={currentPoint}
              isBoosted={settings.isBoostActive}
              onApplyBoost={handleApplyBoost}
              onRevertBoost={handleRevertBoost}
              activeGameName={activeGame.name}
              activeServerName={activeServer.name}
              onExitCompanion={() => setIsMobileCompanionMode(false)}
            />
          </div>
        ) : (
          /* Normal Multi-Tab View */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-950/60">
            {/* Desktop Sidebar Navigation */}
            <aside className="hidden md:flex flex-col justify-between w-60 border-r border-slate-800/80 bg-slate-900/40 p-3 shrink-0">
              <div className="space-y-1">
                {/* Dashboard Tab */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('dashboard');
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                  <span>Real-time Dashboard</span>
                </button>

                {/* Network Health Tab */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('health');
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'health'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Network Health</span>
                </button>

                {/* Games Tab */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('games');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'games'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <span>Game Library</span>
                  </div>
                  {activeGame.isRunning && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                {/* DNS Customization Tab */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('dns');
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'dns'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span>DNS Customization</span>
                </button>

                {/* Game Mode Settings Tab */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('settings');
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'settings'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Game Mode & Stack</span>
                </button>

                {/* Analytics Logs Tab */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('logs');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'logs'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Analytics Logs</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                    {logs.length}
                  </span>
                </button>
              </div>

              {/* Sidebar Footer Live Network Quick Peek */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Routing Protocol</span>
                  <span className="text-cyan-300 font-semibold">{activeGame.protocol}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>TCP Nagle (NoDelay)</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>DSCP Priority</span>
                  <span className="text-indigo-300 font-semibold">46 (EF)</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500">
                  Windows 11 NetQoS Kernel Service
                </div>
              </div>
            </aside>

            {/* Mobile Horizontal Tab Navigation (Header on small screens) */}
            <div className="flex md:hidden items-center justify-around border-b border-slate-800/80 bg-slate-900/60 p-1.5 overflow-x-auto shrink-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('dashboard');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('health');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'health' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                Health & Speed
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('games');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'games' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                Games
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('dns');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'dns' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                DNS
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('settings');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                Game Mode
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('logs');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'logs' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                Logs
              </button>
            </div>

            {/* Content Viewport */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
              {activeTab === 'dashboard' && (
                <DashboardView
                  telemetryHistory={telemetryHistory}
                  currentPoint={currentPoint}
                  activeGame={activeGame}
                  settings={settings}
                  onApplyBoost={handleApplyBoost}
                  onRevertBoost={handleRevertBoost}
                  onNavigateTab={tab => setActiveTab(tab)}
                  onToggleGameRunning={() => handleToggleGameRunning(activeGame.id)}
                />
              )}

              {activeTab === 'health' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <NetworkHealth
                    isBoosted={settings.isBoostActive}
                    activeGameName={activeGame.name}
                    serverLocation={activeServer.location}
                    onOptimizeRequested={handleApplyBoost}
                  />
                </div>
              )}

              {activeTab === 'games' && (
                <GamesView
                  games={games}
                  activeGameId={activeGameId}
                  onSelectGame={handleSelectGame}
                  onSelectServerRegion={handleSelectServerRegion}
                  onToggleGameRunning={handleToggleGameRunning}
                  isBoosted={settings.isBoostActive}
                  autoGameModeEnabled={settings.autoGameMode}
                />
              )}

              {activeTab === 'dns' && (
                <DnsCustomizationView
                  dnsProviders={dnsProviders}
                  activeDnsId={settings.activeDnsId}
                  onApplyDns={handleApplyDns}
                  onApplyCustomDns={handleApplyCustomDns}
                  customPrimary={settings.customDnsPrimary}
                  customSecondary={settings.customDnsSecondary}
                  dnsOverHttps={settings.dnsOverHttps}
                  onFlushDnsCache={handleFlushDnsCache}
                />
              )}

              {activeTab === 'settings' && (
                <GameModeSettingsView
                  settings={settings}
                  onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
                  onResetDefaults={() => {
                    setSettings({
                      isBoostActive: true,
                      autoGameMode: true,
                      gameModeActive: true,
                      nagleDisabled: true,
                      qosDscpTagging: true,
                      mtuSize: 1500,
                      tcpWindowAutoTuning: 'normal',
                      backgroundThrottle: true,
                      multipathRouting: true,
                      soundEffects: true,
                      activeDnsId: 'cloudflare',
                      customDnsPrimary: '1.1.1.1',
                      customDnsSecondary: '1.0.0.1',
                      dnsOverHttps: true,
                    });
                    showNotification('Settings Reset to NetPulse Defaults');
                  }}
                  activeGameName={activeGame.name}
                />
              )}

              {activeTab === 'logs' && (
                <AnalyticsLogsView
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                  currentPing={currentPoint.ping}
                  currentJitter={currentPoint.jitter}
                  currentLoss={currentPoint.packetLoss}
                  isBoosted={settings.isBoostActive}
                  activeGameName={activeGame.name}
                />
              )}
            </main>
          </div>
        )}

        {/* Mobile Bottom Navigation Bar (thumb reachable) */}
        {!isMobileCompanionMode && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-lg flex items-center justify-around py-2 px-1">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('dashboard');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('health');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'health' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>Health</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('games');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'games' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Games</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('dns');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'dns' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              <span>DNS</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('settings');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'settings' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Game Mode</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('logs');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === 'logs' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Logs</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
