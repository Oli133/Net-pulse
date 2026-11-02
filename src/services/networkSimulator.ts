import { OptimizationStep, TelemetryPoint, TelemetryLogEvent } from '../types/network';

export const OPTIMIZATION_PIPELINE: Omit<OptimizationStep, 'status'>[] = [
  {
    id: 'flush_dns',
    title: 'Flush Windows DNS Resolver & Socket Pool',
    description: 'Clears stale hostnames, ARP tables, and cached network sockets',
    detail: 'Executed: ipconfig /flushdns & netsh winsock reset catalog (non-reboot)',
    durationMs: 400,
  },
  {
    id: 'tcp_nodelay',
    title: "Disable Nagle's Algorithm (TCP_NODELAY)",
    description: 'Forces immediate transmission of small game packets without waiting for ACK buffer',
    detail: 'Set: TcpAckFrequency = 1, TCPNoDelay = 1 in Windows Registry Tcpip Parameters',
    durationMs: 500,
  },
  {
    id: 'mtu_optimize',
    title: 'Calibrate MTU & MSS Packet Boundaries',
    description: 'Eliminates router packet fragmentation by tuning maximum transmission unit',
    detail: 'Tuned: MTU 1500 bytes (MSS 1460) with DF (Don\'t Fragment) flag locked',
    durationMs: 450,
  },
  {
    id: 'qos_dscp',
    title: 'Apply DSCP 46 QoS Priority Tagging',
    description: 'Marks outbound game traffic with Expedited Forwarding (EF) header',
    detail: 'Configured: Windows Policy DSCP Value 46 for active game executable socket',
    durationMs: 450,
  },
  {
    id: 'fastpath_tunnel',
    title: 'Engage Anycast Low-Latency Fiber FastPath',
    description: 'Reroutes packet transit from congested ISP public exchanges to private edge backbone',
    detail: 'Established: Tier-1 Direct Peering Route bypassing 4 congested carrier transit hops',
    durationMs: 650,
  },
  {
    id: 'mmcss_priority',
    title: 'Elevate Windows MMCSS Network Thread Priority',
    description: 'Dedicates high-frequency CPU cores to network adapter interrupt handling',
    detail: 'Applied: NetworkThrottlingIndex = 0xFFFFFFFF (Disabled), SystemResponsiveness = 0',
    durationMs: 400,
  },
];

export function calculateJitter(pings: number[]): number {
  if (pings.length < 2) return 0.5;
  const last10 = pings.slice(-10);
  const diffs: number[] = [];
  for (let i = 1; i < last10.length; i++) {
    diffs.push(Math.abs(last10[i] - last10[i - 1]));
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Number(avgDiff.toFixed(1));
}

export function calculateBufferbloatScore(jitter: number, packetLoss: number): { grade: string; color: string; label: string } {
  if (packetLoss === 0 && jitter < 2.5) {
    return { grade: 'A+', color: 'text-emerald-400', label: 'Flawless (Zero Congestion)' };
  }
  if (packetLoss < 0.5 && jitter < 5) {
    return { grade: 'A', color: 'text-emerald-500', label: 'Excellent' };
  }
  if (packetLoss < 1.5 && jitter < 12) {
    return { grade: 'B', color: 'text-cyan-400', label: 'Good' };
  }
  if (packetLoss < 3.0 && jitter < 25) {
    return { grade: 'C', color: 'text-amber-400', label: 'Moderate Bufferbloat' };
  }
  return { grade: 'D', color: 'text-red-400', label: 'Severe Bufferbloat Detected' };
}

export function generateNextTelemetryPoint(
  prevPoint: TelemetryPoint | null,
  isBoosted: boolean,
  targetBaselinePing: number,
  targetBoostedPing: number
): TelemetryPoint {
  const now = Date.now();
  const dateObj = new Date(now);
  const timeLabel = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;

  let ping: number;
  let jitter: number;
  let packetLoss: number;
  let droppedPackets: number;

  if (isBoosted) {
    // Ultra stable, tight range around targetBoostedPing
    const variation = (Math.random() - 0.5) * 3;
    ping = Math.max(12, Math.round(targetBoostedPing + variation));
    jitter = Number((0.6 + Math.random() * 1.4).toFixed(1));
    packetLoss = 0.0;
    droppedPackets = 0;
  } else {
    // ISP route: higher ping, noticeable fluctuations and occasional micro-spikes
    const isSpike = Math.random() < 0.12;
    const baseVariation = (Math.random() - 0.5) * 16;
    const spikeAmount = isSpike ? 25 + Math.random() * 40 : 0;
    ping = Math.max(30, Math.round(targetBaselinePing + baseVariation + spikeAmount));
    jitter = Number((4.5 + Math.random() * 8.5 + (isSpike ? 15 : 0)).toFixed(1));
    
    // Packet loss 0.8% - 3.2%
    packetLoss = Number((isSpike ? 2.5 + Math.random() * 2.5 : Math.random() * 1.5).toFixed(1));
    droppedPackets = packetLoss > 0 ? Math.floor(packetLoss * 2) : 0;
  }

  const trafficRateMbps = Number((isBoosted ? 14.8 + Math.random() * 4 : 8.2 + Math.random() * 3).toFixed(1));

  return {
    timestamp: now,
    timeLabel,
    ping,
    jitter,
    packetLoss,
    droppedPackets,
    trafficRateMbps,
    routeMode: isBoosted ? 'optimized' : 'direct',
  };
}

export function createInitialTelemetryHistory(
  isBoosted: boolean,
  baselinePing: number,
  boostedPing: number,
  count = 30
): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * 1000;
    const d = new Date(timestamp);
    const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

    let ping: number;
    let jitter: number;
    let packetLoss: number;
    let droppedPackets: number;

    if (isBoosted) {
      ping = Math.max(12, Math.round(boostedPing + (Math.sin(i / 3) * 1.5)));
      jitter = 1.2;
      packetLoss = 0;
      droppedPackets = 0;
    } else {
      const spike = i === 12 || i === 24 ? 35 : 0;
      ping = Math.max(30, Math.round(baselinePing + Math.sin(i / 2) * 8 + spike));
      jitter = spike ? 18.4 : 6.8;
      packetLoss = spike ? 2.8 : 1.2;
      droppedPackets = spike ? 4 : 1;
    }

    points.push({
      timestamp,
      timeLabel,
      ping,
      jitter,
      packetLoss,
      droppedPackets,
      trafficRateMbps: isBoosted ? 16.2 : 9.4,
      routeMode: isBoosted ? 'optimized' : 'direct',
    });
  }

  return points;
}
