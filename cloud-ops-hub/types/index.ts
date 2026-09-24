export interface Server {
  id: string
  name: string
  provider: string
  region: string
  ip: string
  status: 'Healthy' | 'Degraded' | 'Offline' | string
  type: string
  cpu: string
  ram: string
  ramUsed: string
  ramTotal: string
  cacheUsed?: string
  cachePct?: string
  disk: string
  diskUsed: string
  diskTotal: string
  color: string
}

export interface ContainerItem {
  name: string
  image: string
  status: 'Running' | 'Exited' | 'Stopped' | 'Online' | string
  port: string
  cpu?: string
  memory?: string
  color?: string
}

export interface BucketItem {
  name: string
  visibility: string
  tier: string
  region: string
  count: string
  size: string
  url: string
}

export interface ProxyHost {
  domain: string
  forward: string
  ssl: string
  status: 'Online' | 'Offline' | 'Warning' | string
}

export interface TerminalEntry {
  time: string
  type: 'info' | 'error' | 'success' | 'cmd' | string
  text: string
}

export interface CurrentUser {
  id?: string
  name: string
  email: string
  role?: string
  status?: string
}

export interface ScraperData {
  isRunning: boolean
  status: string
  attempts: number
  successfulVm: any
  lastAttemptAt: string | null
  currentProfile: any
  logs: any[]
  profiles: any[]
  profileIndex: number
  intervalSeconds: number
}
