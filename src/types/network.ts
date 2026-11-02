export type RouteOptimizationMode = 'direct' | 'optimized' | 'multipath';

export interface GameServerRegion {
  id: string;
  name: string;
  location: string;
  countryCode: string;
  baselinePing: number;
  boostedPing: number;
  serverIp: string;
  packetLossBaseline: number;
}

export interface GameProfile {
  id: string;
  name: string;
  category: 'FPS' | 'Tactical' | 'Battle Royale' | 'MOBA' | 'Sports' | 'Survival';
  exeName: string;
  defaultPort: string;
  protocol: 'UDP' | 'TCP/UDP';
  iconColor: string;
  iconBg: string;
  coverImage?: string;
  servers: GameServerRegion[];
  selectedServerId: string;
  isRunning: boolean;
  isOptimized: boolean;
}

export interface TelemetryPoint {
  timestamp: number;
  timeLabel: string;
  ping: number;
  jitter: number;
  packetLoss: number;
  droppedPackets: number;
  trafficRateMbps: number;
  routeMode: RouteOptimizationMode;
}

export interface OptimizationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  detail: string;
  durationMs: number;
}

export interface DnsProvider {
  id: string;
  name: string;
  provider: string;
  primary: string;
  secondary: string;
  features: string[];
  latencyMs: number | null;
  isTesting: boolean;
  isRecommended?: boolean;
}

export interface NetworkHop {
  hopNumber: number;
  ip: string;
  host: string;
  location: string;
  asn: string;
  latencyMs: number;
  lossPercent: number;
  isOptimizedRoute: boolean;
}

export interface TelemetryLogEvent {
  id: string;
  timestamp: string;
  type: 'boost' | 'warning' | 'route' | 'dns' | 'process' | 'latency';
  severity: 'info' | 'success' | 'warning' | 'error';
  title: string;
  details: string;
  pingMs?: number;
  packetLossPercent?: number;
}

export interface NetworkSettings {
  isBoostActive: boolean;
  autoGameMode: boolean;
  gameModeActive: boolean;
  nagleDisabled: boolean; // TCP_NODELAY
  qosDscpTagging: boolean; // DSCP 46
  mtuSize: number;
  tcpWindowAutoTuning: 'normal' | 'experimental' | 'disabled';
  backgroundThrottle: boolean;
  multipathRouting: boolean;
  soundEffects: boolean;
  activeDnsId: string;
  customDnsPrimary: string;
  customDnsSecondary: string;
  dnsOverHttps: boolean;
}
