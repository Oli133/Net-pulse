import React from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Wifi, 
  Zap, 
  Gamepad2, 
  Volume2, 
  VolumeX, 
  Smartphone,
  Maximize2
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface WindowsTitleBarProps {
  isBoosted: boolean;
  gameModeActive: boolean;
  activeGameName?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  mobileCompanionMode: boolean;
  onToggleMobileCompanion: () => void;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  isBoosted,
  gameModeActive,
  activeGameName,
  soundEnabled,
  onToggleSound,
  isMaximized,
  onToggleMaximize,
  onMinimize,
  onClose,
  mobileCompanionMode,
  onToggleMobileCompanion,
}) => {
  return (
    <div className="h-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-3 select-none text-xs text-slate-300 z-50 shrink-0">
      {/* App brand & Icon */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/30">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">NetPulse</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">Windows Gaming Latency Optimizer</span>
        </div>
      </div>

      {/* Center status indicators */}
      <div className="hidden md:flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
          isBoosted 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
        }`}>
          <Wifi className={`w-3 h-3 ${isBoosted ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>{isBoosted ? 'FASTPATH TIER-1 OPTIMIZED' : 'STANDARD ISP ROUTE'}</span>
        </div>

        {gameModeActive && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/40 border border-cyan-500/40 text-cyan-300">
            <Gamepad2 className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>GAME MODE: {activeGameName || 'ACTIVE'}</span>
          </div>
        )}
      </div>

      {/* Right controls: sound toggle, companion mode, windows min/max/close */}
      <div className="flex items-center gap-1">
        {/* Sound toggle */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleSound();
          }}
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
          title={soundEnabled ? 'Mute Audio Cues' : 'Unmute Audio Cues'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {/* Mobile companion view toggle */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleMobileCompanion();
          }}
          className={`px-2 h-7 flex items-center gap-1.5 rounded transition-colors text-[11px] font-medium ${
            mobileCompanionMode 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Mobile Companion HUD Mode"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{mobileCompanionMode ? 'Companion HUD' : 'Desk HUD'}</span>
        </button>

        {/* Windows style control buttons */}
        <div className="flex items-center ml-2 border-l border-slate-800 pl-2">
          <button
            onClick={() => {
              sounds.playClick();
              onMinimize();
            }}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Minimize to Windows Taskbar / System Tray"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => {
              sounds.playClick();
              onToggleMaximize();
            }}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isMaximized ? 'Restore Window' : 'Maximize Window'}
          >
            {isMaximized ? <Maximize2 className="w-3.5 h-3.5" /> : <Square className="w-3 h-3" />}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Close (Minimizes to System Tray in Background)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
