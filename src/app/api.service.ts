import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, exhaustMap, retry, shareReplay, take, concatWith } from 'rxjs';

// The shape of the new JSON from C++
export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
}

// The shape of the new JSON from C++
export interface SystemStats {
  ram_total_mb: number;
  ram_free_mb: number;
  ram_percent: number;
  swap_total_mb: number;
  swap_free_mb: number;
  swap_percent: number;
  cpu_percent: number;
  cpu_temp_c: number;
  disk_percent: number;
  disk_total_gb: number;
  disk_free_gb: number;
  volumes: { name: string, percent: number }[];
  net_rx_mbps: number;
  net_tx_mbps: number;
  uptime_seconds: number;
  load_avg: number;
  cpu_history: number[];
  rx_history: number[];
  tx_history: number[];
  os_name: string;
  kernel_version: string;
  cpu_model: string;
  sys_time: string;
  top_processes: ProcessInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  // 🌐 Production Proxy Path (via Hub reverse proxy)
  public baseUrl = '/api-simulacrum';

  // 🚀 Uncomment for direct local/VPN testing:
  // private baseUrl = 'http://100.84.119.50:8080/api';  // Tailscale
  // private baseUrl = 'http://192.168.192.123:8080/api'; // Local NAS

  getLiveStats(): Observable<SystemStats> {
    // ⚡ 'Frenzy Mode' for first 30s (500ms), then 'Steady Mode' (1000ms)
    const frenzyTicker = timer(0, 500).pipe(take(60)); // 60 ticks * 500ms = 30s
    const steadyTicker = timer(0, 1000);

    return frenzyTicker.pipe(
      concatWith(steadyTicker),
      exhaustMap(() => {
        const url = `${this.baseUrl}/stats`;
        return this.http.get<SystemStats>(url);
      }),
      retry({
        count: 3,
        delay: 1000,
        resetOnSuccess: true
      }),
      shareReplay(1)
    );
  }
}