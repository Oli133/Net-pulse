import React, { useRef, useEffect, useState } from 'react';
import { TelemetryPoint } from '../types/network';
import { Activity, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TelemetryChartProps {
  data: TelemetryPoint[];
  isBoosted: boolean;
  activeGameName: string;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  isBoosted,
  activeGameName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [timeRange, setTimeRange] = useState<'30s' | '60s' | '120s'>('60s');

  // Filter data according to selected timeframe
  const pointsToRender = React.useMemo(() => {
    const count = timeRange === '30s' ? 30 : timeRange === '60s' ? 60 : 120;
    return data.slice(-count);
  }, [data, timeRange]);

  const stats = React.useMemo(() => {
    if (pointsToRender.length === 0) return { min: 0, max: 0, avg: 0, lossAvg: 0 };
    const pings = pointsToRender.map(p => p.ping);
    const losses = pointsToRender.map(p => p.packetLoss);
    return {
      min: Math.min(...pings),
      max: Math.max(...pings),
      avg: Math.round(pings.reduce((a, b) => a + b, 0) / pings.length),
      lossAvg: Number((losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(1)),
    };
  }, [pointsToRender]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.clearRect(0, 0, width, height);

    if (pointsToRender.length < 2) return;

    // Dimensions
    const paddingLeft = 36;
    const paddingRight = 16;
    const paddingTop = 20;
    const paddingBottom = 32;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Calculate Y-axis scaling (clamp max to at least 80ms for good scale)
    const maxPingVal = Math.max(80, Math.ceil((Math.max(...pointsToRender.map(p => p.ping)) + 15) / 20) * 20);
    const minPingVal = 0;

    // Draw horizontal grid lines and labels
    const gridSteps = 4;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const pingVal = Math.round(minPingVal + (maxPingVal - minPingVal) * (i / gridSteps));
      const y = paddingTop + plotHeight - (plotHeight * (i / gridSteps));

      ctx.beginPath();
      ctx.strokeStyle = i === 0 ? 'rgba(51, 65, 85, 0.4)' : 'rgba(51, 65, 85, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash(i === 0 ? [] : [3, 4]);
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillText(`${pingVal}ms`, paddingLeft - 6, y);
    }

    // Packet Loss Track (bottom strip)
    const lossTrackY = height - 12;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.fillRect(paddingLeft, lossTrackY - 4, plotWidth, 8);

    // Draw Packet Loss events
    pointsToRender.forEach((point, idx) => {
      if (point.packetLoss > 0) {
        const x = paddingLeft + (plotWidth * (idx / (pointsToRender.length - 1)));
        ctx.fillStyle = point.packetLoss > 2.0 ? '#ef4444' : '#f59e0b';
        ctx.fillRect(x - 2, lossTrackY - 4, 4, 8);
      }
    });

    // Coordinates generator
    const getCoords = (point: TelemetryPoint, idx: number) => {
      const x = paddingLeft + (plotWidth * (idx / (pointsToRender.length - 1)));
      const normalizedPing = Math.max(0, Math.min(1, (point.ping - minPingVal) / (maxPingVal - minPingVal)));
      const y = paddingTop + plotHeight - (plotHeight * normalizedPing);
      return { x, y };
    };

    // Draw gradient area under the latency curve
    const areaGradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);
    if (isBoosted) {
      areaGradient.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
      areaGradient.addColorStop(1, 'rgba(6, 182, 212, 0.01)');
    } else {
      areaGradient.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      areaGradient.addColorStop(1, 'rgba(245, 158, 11, 0.01)');
    }

    ctx.beginPath();
    const firstPoint = getCoords(pointsToRender[0], 0);
    ctx.moveTo(firstPoint.x, paddingTop + plotHeight);
    ctx.lineTo(firstPoint.x, firstPoint.y);

    // Curved interpolation
    for (let i = 1; i < pointsToRender.length; i++) {
      const p0 = getCoords(pointsToRender[i - 1], i - 1);
      const p1 = getCoords(pointsToRender[i], i);
      const midX = (p0.x + p1.x) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, (p0.y + p1.y) / 2);
    }
    const lastPoint = getCoords(pointsToRender[pointsToRender.length - 1], pointsToRender.length - 1);
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(lastPoint.x, paddingTop + plotHeight);
    ctx.closePath();
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Draw main latency line
    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (let i = 1; i < pointsToRender.length; i++) {
      const p0 = getCoords(pointsToRender[i - 1], i - 1);
      const p1 = getCoords(pointsToRender[i], i);
      const midX = (p0.x + p1.x) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, (p0.y + p1.y) / 2);
    }
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.strokeStyle = isBoosted ? '#06b6d4' : '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Pulse dot on the latest live point
    const liveCoords = getCoords(pointsToRender[pointsToRender.length - 1], pointsToRender.length - 1);
    ctx.beginPath();
    ctx.arc(liveCoords.x, liveCoords.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isBoosted ? '#22d3ee' : '#fbbf24';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(liveCoords.x, liveCoords.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = isBoosted ? 'rgba(34, 211, 238, 0.4)' : 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw hover vertical indicator line if active
    if (hoverPos) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.moveTo(hoverPos.x, paddingTop);
      ctx.lineTo(hoverPos.x, paddingTop + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [pointsToRender, isBoosted, hoverPos]);

  // Handle pointer interaction for inspecting values
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || pointsToRender.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 36;
    const paddingRight = 16;
    const plotWidth = rect.width - paddingLeft - paddingRight;

    if (x >= paddingLeft && x <= rect.width - paddingRight) {
      const ratio = (x - paddingLeft) / plotWidth;
      const index = Math.round(ratio * (pointsToRender.length - 1));
      const clampedIndex = Math.max(0, Math.min(pointsToRender.length - 1, index));
      setHoveredPoint(pointsToRender[clampedIndex]);
      setHoverPos({ x, y });
    } else {
      setHoveredPoint(null);
      setHoverPos(null);
    }
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col relative overflow-hidden backdrop-blur-sm">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isBoosted ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-wide">Live Latency & Packet Loss Telemetry</h3>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isBoosted 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}>
                {isBoosted ? 'STABILIZED' : 'FLUCTUATING'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Target Game: <span className="text-slate-200 font-medium">{activeGameName}</span> · Polling rate: 1000ms
            </p>
          </div>
        </div>

        {/* Time range selector & Summary Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-0.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono">
            {(['30s', '60s', '120s'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 rounded transition-colors ${
                  timeRange === range
                    ? 'bg-slate-800 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
            <div>
              <span className="text-slate-500">Min:</span> <span className="text-slate-200 tabular-nums">{stats.min}ms</span>
            </div>
            <div>
              <span className="text-slate-500">Avg:</span> <span className="text-slate-200 tabular-nums">{stats.avg}ms</span>
            </div>
            <div>
              <span className="text-slate-500">Max:</span> <span className="text-slate-200 tabular-nums">{stats.max}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div ref={containerRef} className="w-full h-44 sm:h-52 relative select-none">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Hover Tooltip Card */}
        {hoveredPoint && hoverPos && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-950/95 border border-slate-700/80 rounded-lg p-2.5 shadow-xl shadow-black/60 text-xs backdrop-blur-md transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: Math.max(70, Math.min(hoverPos.x, (containerRef.current?.clientWidth || 300) - 70)),
              top: Math.max(10, hoverPos.y - 10),
            }}
          >
            <div className="text-[11px] font-mono text-slate-400 mb-1 border-b border-slate-800 pb-1">
              {hoveredPoint.timeLabel}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono">
              <span className="text-slate-400">Ping:</span>
              <span className="text-right font-semibold text-white tabular-nums">{hoveredPoint.ping} ms</span>
              
              <span className="text-slate-400">Jitter:</span>
              <span className="text-right text-cyan-300 tabular-nums">±{hoveredPoint.jitter} ms</span>

              <span className="text-slate-400">Packet Loss:</span>
              <span className={`text-right tabular-nums font-semibold ${hoveredPoint.packetLoss > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {hoveredPoint.packetLoss}%
              </span>

              <span className="text-slate-400">Bandwidth:</span>
              <span className="text-right text-slate-300 tabular-nums">{hoveredPoint.trafficRateMbps} Mb/s</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend & Packet Loss Strip label */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-0.5 rounded-full ${isBoosted ? 'bg-cyan-400' : 'bg-amber-400'}`} />
            <span>RTT Latency (ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 bg-amber-500/80 rounded-xs" />
            <span>Packet Drop Markers</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {stats.lossAvg === 0 ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 0.0% Loss (Pristine Stream)
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Loss Rate: {stats.lossAvg}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
