import React, { useState } from 'react';
import { GameProfile } from '../types/network';
import { 
  Gamepad2, 
  Search, 
  Play, 
  Square, 
  Check, 
  Zap, 
  Globe, 
  Server, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface GamesViewProps {
  games: GameProfile[];
  activeGameId: string;
  onSelectGame: (gameId: string) => void;
  onSelectServerRegion: (gameId: string, serverId: string) => void;
  onToggleGameRunning: (gameId: string) => void;
  isBoosted: boolean;
  autoGameModeEnabled: boolean;
}

export const GamesView: React.FC<GamesViewProps> = ({
  games,
  activeGameId,
  onSelectGame,
  onSelectServerRegion,
  onToggleGameRunning,
  isBoosted,
  autoGameModeEnabled,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'FPS', 'Battle Royale', 'MOBA', 'Tactical', 'Sports', 'Survival'];

  const filteredGames = games.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.exeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeGame = games.find(g => g.id === activeGameId) || games[0];
  const selectedServer = activeGame.servers.find(s => s.id === activeGame.selectedServerId) || activeGame.servers[0];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            Supported Gaming Library & Route Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimized packet tunnels with custom routing tables for major competitive online games.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search game or .exe name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40"
          />
        </div>
      </div>

      {/* Category Pills (Interactive Filter Controls) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              sounds.playClick();
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Layout Split: Game Selection Grid on Left + Active Game Server Config on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Games Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredGames.map(game => {
            const isSelected = game.id === activeGameId;
            const currentServer = game.servers.find(s => s.id === game.selectedServerId) || game.servers[0];
            return (
              <div
                key={game.id}
                onClick={() => {
                  sounds.playClick();
                  onSelectGame(game.id);
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-500/60 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Status indicator bar */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: game.iconBg, color: game.iconColor }}
                    >
                      {game.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {game.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                        {game.exeName}
                      </div>
                    </div>
                  </div>

                  {/* Running state badge */}
                  {game.isRunning && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      RUNNING
                    </span>
                  )}
                </div>

                {/* Server & ping preview */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 truncate max-w-[120px]">{currentServer.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 line-through text-[10px]">{currentServer.baselinePing}ms</span>
                    <span className="text-emerald-400 font-bold">{currentServer.boostedPing}ms</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Game Deep Configuration Panel */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5 backdrop-blur-md">
          {/* Active Game Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                style={{ backgroundColor: activeGame.iconBg, color: activeGame.iconColor }}
              >
                {activeGame.name.substring(0, 3).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{activeGame.name}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Process: <span className="text-slate-300">{activeGame.exeName}</span>
                </div>
              </div>
            </div>

            {/* Simulated Process Hook Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onToggleGameRunning(activeGame.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
                activeGame.isRunning
                  ? 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
              }`}
              title={activeGame.isRunning ? 'Simulate Closing Game' : 'Simulate Game Launching on Windows'}
            >
              {activeGame.isRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Process</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simulate Launch</span>
                </>
              )}
            </button>
          </div>

          {/* Auto Game Mode Notification Alert */}
          {autoGameModeEnabled && (
            <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs flex items-center gap-2 text-cyan-200">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Auto Game Mode is <strong>ENABLED</strong>: Launching this game automatically locks network priority and tunes routing.
              </span>
            </div>
          )}

          {/* Server Region Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Select Game Server Region
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {activeGame.servers.length} Datacenters
              </span>
            </label>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {activeGame.servers.map(server => {
                const isCurrentServer = server.id === activeGame.selectedServerId;
                return (
                  <div
                    key={server.id}
                    onClick={() => {
                      sounds.playClick();
                      onSelectServerRegion(activeGame.id, server.id);
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-all flex items-center justify-between ${
                      isCurrentServer
                        ? 'bg-cyan-950/30 border-cyan-500/50 text-white'
                        : 'bg-slate-950/40 hover:bg-slate-950/70 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 text-center text-slate-500 font-bold text-[10px]">
                        {server.countryCode}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{server.name}</div>
                        <div className="text-[10px] text-slate-500">{server.location}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <div className="text-emerald-400 font-bold tabular-nums">
                          {isBoosted ? server.boostedPing : server.baselinePing} ms
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isBoosted ? 'FastPath' : 'ISP'}
                        </div>
                      </div>
                      {isCurrentServer && (
                        <Check className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Network Architecture Details */}
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Socket & Protocol Profile
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Ports: </span>
                <span className="text-slate-200">{activeGame.defaultPort}</span>
              </div>
              <div>
                <span className="text-slate-500">Protocol: </span>
                <span className="text-slate-200">{activeGame.protocol}</span>
              </div>
              <div>
                <span className="text-slate-500">Active IP: </span>
                <span className="text-slate-200">{selectedServer.serverIp}</span>
              </div>
              <div>
                <span className="text-slate-500">QoS DSCP: </span>
                <span className="text-cyan-300">46 (Expedited)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
