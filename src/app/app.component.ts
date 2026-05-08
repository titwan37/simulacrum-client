import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, SystemStats } from './api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  host: {
    '[attr.data-theme]': 'isDarkMode() ? "dark" : "light"'
  },
  template: `
    <div class="dashboard-wrapper">
      <header>
        <div class="header-top-bar">
          <div class="header-left">
            <!-- 🌓 THEME TOGGLE -->
            <div class="sys-time" *ngIf="statsSignal()?.sys_time as time">
              Remote Time: {{ time }}
            </div>
            <button class="theme-toggle-btn" (click)="toggleTheme()" [title]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              <span class="icon">{{ isDarkMode() ? '🌙' : '☀️' }}</span>
            </button>
            <div class="status-badge" [class.online]="!!statsSignal() && !statsError()">
              <span class="pulse"></span>
              {{ statsSignal() && !statsError() ? 'LIVE' : (statsError() ? 'OFFLINE' : 'CONNECTING') }}
            </div>
          </div>

          <!-- 📜 API SPEC BUTTON -->
          <button class="api-spec-btn" (click)="toggleSwagger()">
            <span class="icon">📜</span>
            API Specs
          </button>
        </div>

        <div *ngIf="statsError()" class="error-banner">
          ⚠️ {{ statsError() }}
        </div>

        <h1 class="title">Synology<span>Monitor</span></h1>
        <p class="subtitle">System Health & Resource Analytics</p>
          <div class="uptime-bar" *ngIf="statsSignal() as stats">
            <span class="clock-icon">🕒</span> 
            Node: <code class="tag" (click)="isJsDebugVisible.set(true)" style="cursor: pointer;" title="Show Diagnostic Monitor">NAS DS924+</code>
            <span class="dot-separator">•</span>
            <span class="tech-val">{{ stats.os_name || 'DSM' }}</span>
            <span class="dot-separator">•</span>
            Uptime: <code class="tag">{{ (stats.uptime_seconds / 3600).toFixed(1) }} hours</code>
            <span class="dot-separator">•</span>
            <span class="tech-val">{{ stats.cpu_model }}</span>
            <span class="dot-separator">•</span>
            Kernel: <code class="tag">{{ stats.kernel_version }}</code>
          </div>
      </header>
        
      <div *ngIf="!statsSignal()" class="skeleton-grid">
         <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
      </div>

      <div *ngIf="statsSignal() as stats">
        <div class="stats-grid">
          <!-- RAM CARD -->
          <div class="glass-card ram">
            <div class="card-header">
              <span class="icon">🧠</span>
              <h3>Access Memory</h3>
            </div>
            <div class="visualizer">
              <div class="percentage">{{ stats.ram_percent }}<span>%</span></div>
              <div class="progress-container">
                <div class="progress-bar" [style.width.%]="stats.ram_percent" [class.danger]="stats.ram_percent > 90"></div>
              </div>
              <!-- 💾 SWAP INDICATOR -->
              <div class="swap-indicator" *ngIf="stats.swap_total_mb > 0">
                 <label>SWAP: {{ stats.swap_percent }}%</label>
                 <div class="mini-bar"><div [style.width.%]="stats.swap_percent"></div></div>
              </div>
            </div>
            <div class="card-footer">
              <div class="stat-item">
                <div class="net-label">Used</div>
                <span>{{ (stats.ram_total_mb - stats.ram_free_mb).toLocaleString() }} MB</span>
              </div>
              <div class="divider"></div>
              <div class="stat-item">
                <div class="net-label">Total</div>
                <span>{{ stats.ram_total_mb.toLocaleString() }} MB</span>
              </div>
            </div>
          </div>

          <!-- CPU CARD -->
          <div class="glass-card cpu">
            <div class="card-header">
              <span class="icon">⚙️</span>
              <h3>CPU Load</h3>
              <div class="thermal-badge" [style.color]="stats.cpu_temp_c > 70 ? '#ef4444' : (stats.cpu_temp_c > 50 ? '#f59e0b' : '#60a5fa')">
                 {{ stats.cpu_temp_c.toFixed(1) }}°C
              </div>
            </div>
            <div class="visualizer">
              <div class="percentage">{{ stats.cpu_percent }}<span>%</span></div>
              <div class="progress-container">
                <div class="progress-bar cpu-fill" [style.width.%]="stats.cpu_percent" [class.danger]="stats.cpu_percent > 80"></div>
              </div>
            </div>
            <div class="card-footer single">
              <div class="stat-item">
                <label>System Load Avg</label>
                <span class="tech-val">{{ stats.load_avg }}</span>
              </div>
            </div>
          </div>

          <!-- 🚀 NETWORK CARD -->
          <div class="glass-card network">
            <div class="card-header">
              <span class="icon">📡</span>
              <h3>Network I/O</h3>
            </div>
            <div class="net-grid">
              <div class="net-item down">
                 <div class="net-label">
                   <span class="net-down">↓</span> DOWNLOAD
                 </div>
                 <div class="net-value">{{ stats.net_rx_mbps.toFixed(2) }} <span>Mbps</span></div>
              </div>
              <div class="net-item up">
                 <div class="net-label">
                   <span class="net-up">↑</span> UPLOAD
                 </div>
                 <div class="net-value">{{ stats.net_tx_mbps.toFixed(2) }} <span>Mbps</span></div>
              </div>
            </div>
            <div class="net-footer">
               Real-time data throughput (tx/rx)
            </div>
            <!-- 📉 NETWORK MINI-LIFELINE -->
            <div class="net-chart">
               <svg viewBox="0 0 1000 40" preserveAspectRatio="none">
                 <path [attr.d]="netPaths().rx" class="net-path rx" />
                 <path [attr.d]="netPaths().tx" class="net-path tx" />
               </svg>
            </div>
          </div>

          <!-- DISK CARD -->
          <div class="glass-card disk">
            <div class="card-header">
              <span class="icon">💾</span>
              <h3>Storage</h3>
            </div>
            <div class="visualizer">
              <div class="percentage">{{ stats.disk_percent }}<span>%</span></div>
              <div class="progress-container">
                <div class="progress-bar disk-fill" [style.width.%]="stats.disk_percent"></div>
              </div>
            </div>

            <div class="card-footer">
              <div class="stat-item">
                <div class="net-label">Available</div>
                <span>{{ stats.disk_free_gb }} GB</span>
              </div>
              <div class="divider"></div>
              <div class="stat-item">
                <div class="net-label">Capacity</div>
                <span>{{ stats.disk_total_gb }} GB</span>
              </div>
            </div>
          </div>
        </div>

        <div class="lifeline-container" [class.frenzy-mode]="isFrenzy()" *ngIf="statsSignal()">
          <div class="lifeline-label">CPU HEARTBEAT (60s)</div>
          <div class="lifeline-grid"></div>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path [attr.d]="lifelinePath()" class="lifeline-path" />
          </svg>
        </div>

        <!-- 🧬 SYSTEM HEARTBEAT MATRIX (Heatmap Waterfall) ✨ -->
        <div class="heatmap-container" [class.frenzy]="isFrenzy()" *ngIf="statsSignal()">
          <div class="heatmap-header">SYSTEM PRESSURE MATRIX (60s Pulse)</div>
          <div class="heatmap-body">
            <div class="heatmap-row" *ngFor="let row of heatmapMatrix()">
              <label class="row-label">{{ row.label }}</label>
              <div class="row-cells">
                <div class="heatmap-cell" 
                  *ngFor="let intensity of row.cells" 
                  [style.background]="'hsl(var(--heat-h, 240), 100%, ' + (20 + (intensity * 60)) + '%)'"
                  [style.opacity]="0.3 + (intensity * 0.7)"
                  [title]="row.label + ': ' + (intensity * 100).toFixed(0) + '%'">
                </div>
              </div>
            </div>
          </div>
        </div>

          <!-- 🧬 SYSTEM DNA CARD (Wide Landscape Format) ✨ -->
          <div class="tech-stack-card">
            <div class="tech-header">
              <span class="icon">🧬</span> SYSTEM DNA <span class="icon">✨</span>
            </div>
            <div class="tech-body">
              <div class="tech-sector">
                <span class="tech-label">FRONTEND</span>
                <span class="tech-val">Angular 19+</span>
              </div>
              <div class="tech-sep"></div>
              <div class="tech-sector">
                <span class="tech-label">BACKEND</span>
                <span class="tech-val">C++ 17</span>
              </div>
              <div class="tech-sep"></div>
              <div class="tech-sector">
                <span class="tech-label">INFRA</span>
                <span class="tech-val">Ansible/Docker</span>
              </div>
            </div>
          </div>
      </div>

      <!-- 🎭 SWAGGER UI OVERLAY -->
      <div class="swagger-overlay" [class.visible]="isSwaggerVisible()" (click)="toggleSwagger()">
        <div class="swagger-content" [class.collapsed]="isSwaggerCollapsed()" (click)="$event.stopPropagation()">
            <div class="swagger-header">
                <h3>📖 API Discovery Service</h3>
                <div class="header-actions">
                    <button class="download-btn" (click)="downloadSpec()" title="Download Raw Specification">
                        <span>📥</span> Spec
                    </button>
                    <button class="control-btn mini" (click)="toggleSwaggerCollapse()" [title]="isSwaggerCollapsed() ? 'Expand' : 'Minimize'">
                        {{ isSwaggerCollapsed() ? '□' : '—' }}
                    </button>
                    <button class="close-btn" (click)="toggleSwagger()">×</button>
                </div>
            </div>

            <!-- 🔄 LOADING STATE -->
            <div *ngIf="swaggerStatus() === 'loading'" class="swagger-loader-state">
                <div class="pulse-ring"></div>
                <div class="loader-text">📡 Authenticating with C++ Pulse Core...</div>
                <div class="loader-sub">Synchronizing OpenAPI 3.0 Manifest</div>
            </div>

            <!-- ❌ ERROR STATE -->
            <div *ngIf="swaggerStatus() === 'error'" class="swagger-error-state">
                <div class="error-card">
                    <span class="error-icon">⚠️</span>
                    <h4>Technical Discovery Blocked</h4>
                    <p>{{ swaggerErrorMessage() || 'The API specification could not be parsed or found.' }}</p>
                    <div class="error-actions">
                        <button class="retry-btn" (click)="initSwagger()">🔄 Retry Sync</button>
                        <button class="fallback-btn" (click)="downloadSpec()">📥 Download YAML</button>
                    </div>
                </div>
            </div>

            <!-- ✅ SUCCESS STATE (Wrapped in a neutral viewport to prevent framework contention) -->
            <div class="swagger-ui-viewport" [class.hidden-container]="swaggerStatus() !== 'success'">
                <div id="swagger-ui"></div>
            </div>
        </div>
      </div>

      <!-- 🗄️ MULTI-VOLUME MONITOR (Floating Overlay) -->
      <div class="volumes-overlay" *ngIf="isVolumesVisible()" [class.collapsed]="isVolumesCollapsed()">
        <div class="debug-header">
          <div class="header-main">
            <span class="icon">🗄️</span>
            <h3>Volumes Monitor</h3>
          </div>
          <div class="debug-controls">
            <button class="control-btn mini" (click)="toggleVolumesCollapse()" [title]="isVolumesCollapsed() ? 'Expand' : 'Minimize'">
              {{ isVolumesCollapsed() ? '□' : '—' }}
            </button>
            <button class="control-btn close" (click)="toggleVolumesVisible()" title="Dispose Monitor">×</button>
          </div>
        </div>
        <div class="debug-content" *ngIf="!isVolumesCollapsed()">
            <div class="volume-row" *ngFor="let vol of statsSignal()?.volumes">
              <span class="vol-label">{{ vol.name.replace('Volume ', 'V') }}</span>
              <div class="mini-bar-track">
                <div class="mini-bar-fill" [style.width.%]="vol.percent"></div>
              </div>
              <span class="vol-percent">{{ vol.percent }}%</span>
            </div>
        </div>
      </div>

      <!-- 📊 PROCESS MONITOR (Floating Overlay) -->
      <div class="process-overlay" *ngIf="isProcessVisible()" [class.collapsed]="isProcessCollapsed()">
        <div class="debug-header">
          <div class="header-main">
            <span class="icon">📊</span>
            <h3>Process Monitor</h3>
          </div>
          <div class="debug-controls">
            <button class="control-btn mini" (click)="toggleProcessCollapse()" [title]="isProcessCollapsed() ? 'Expand' : 'Minimize'">
              {{ isProcessCollapsed() ? '□' : '—' }}
            </button>
            <button class="control-btn close" (click)="toggleProcessVisible()" title="Dispose Monitor">×</button>
          </div>
        </div>
        <div class="debug-content" *ngIf="!isProcessCollapsed()">
          <div class="process-table-container" *ngIf="statsSignal()?.top_processes as procs">
            <table class="process-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>NAME</th>
                  <th class="cell-num">CPU%</th>
                  <th class="cell-num">MEM</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of procs">
                  <td>{{ p.pid }}</td>
                  <td>{{ p.name }}</td>
                  <td class="cell-num highlight">{{ p.cpu }}%</td>
                  <td class="cell-num">{{ p.mem }}MB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <!-- 🛠️ JSDebug Diagnostic Overlay -->
      <div class="jsdebug-overlay" *ngIf="isJsDebugVisible()" [class.collapsed]="isJsDebugCollapsed()">
        <div class="debug-header">
          <div class="header-main">
            <span class="icon">🔧</span>
            [SYS_LOG]: Diagnostic Monitor
          </div>
          <div class="debug-controls">
            <button class="control-btn mini" (click)="toggleJsDebugCollapse()" [title]="isJsDebugCollapsed() ? 'Expand' : 'Minimize'">
              {{ isJsDebugCollapsed() ? '□' : '—' }}
            </button>
            <button class="control-btn close" (click)="toggleJsDebugVisible()" title="Dispose Monitor">×</button>
          </div>
        </div>
        
        <div class="debug-content" *ngIf="!isJsDebugCollapsed()">
          <div class="debug-line">
            <span class="lbl">TARGET:</span> 
            <code class="val">{{ api.baseUrl }}/stats</code>
          </div>
          <div class="debug-line">
            <span class="lbl">STATUS:</span> 
            <span class="val" [class.err]="statsError()">{{ statsError() ? 'FAILED' : (statsSignal() ? 'CONNECTED' : 'POLLING...') }}</span>
          </div>

          <div class="debug-line scrollable">
            <span class="lbl">DATA: (raw api response) 📐</span>
            <pre class="val">{{ statsSignal() | json | slice:0:1000 }}</pre>
          </div>
          <div *ngIf="statsError()" class="debug-line error-trace">
            <span class="lbl">TRACE:</span>
            <span class="val">{{ statsError() }}</span>
          </div>

          <!-- 📜 LIVE CONSOLE CAPTURE section -->
          <div class="debug-logs-section">
            <div class="debug-logs-header">
              <span>CONSOLE_STREAM</span>
              <button class="clear-logs" (click)="debugLogs.set([])">Clear</button>
            </div>
            <div class="debug-logs-body scrollable">
              <div *ngFor="let log of debugLogs()" class="log-entry" [class]="log.type">
                <span class="log-time">[{{ log.time }}]</span>
                <span class="log-msg">{{ log.msg }}</span>
              </div>
              <div *ngIf="debugLogs().length === 0" class="log-placeholder">Waiting for engine events...</div>
            </div>
          </div>
        </div>
      </div>


      <footer class="footer">
        &copy; 2026 Antoine Falempin | Orchestrated via Ansible & IONOS IaaS
      </footer>      
    </div>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  public api = inject(ApiService);
  statsSignal = toSignal(this.api.getLiveStats());
  statsError = signal<string | null>(null);
  // ⚡ Frenzy Mode State (15s startup intensity)
  isFrenzy = signal(true);
  private isFirstLoad = true;

  // 🧬 Heartbeat Heatmap (60 datapoints = 1 minute pulse)
  heartbeatBuffer = signal<SystemStats[]>([]);

  // 🔥 Heatmap Matrix Projector
  heatmapMatrix = computed(() => {
    const buffer = this.heartbeatBuffer();
    // Return a dummy matrix if buffer is empty to maintain layout stability
    const metrics = [
      { label: 'CPU', val: (s: SystemStats) => (s && s.cpu_percent !== undefined ? s.cpu_percent / 100 : 0) },
      { label: 'RAM', val: (s: SystemStats) => (s && s.ram_percent !== undefined ? s.ram_percent / 100 : 0) },
      { label: 'LOAD', val: (s: SystemStats) => (s && s.load_avg !== undefined ? Math.min(s.load_avg / 4, 1) : 0) },
      { label: 'NET-RX', val: (s: SystemStats) => (s && s.net_rx_mbps !== undefined ? Math.min(s.net_rx_mbps / 100, 1) : 0) },
      { label: 'NET-TX', val: (s: SystemStats) => (s && s.net_tx_mbps !== undefined ? Math.min(s.net_tx_mbps / 100, 1) : 0) },
      { label: 'DISK', val: (s: SystemStats) => (s && s.disk_percent !== undefined ? s.disk_percent / 100 : 0) }
    ];

    return metrics.map(m => ({
      label: m.label,
      cells: buffer.map(s => m.val(s))
    }));
  });

  // 📈 System History (300 datapoints = 5 minutes @ 1s)
  cpuHistory = signal<number[]>(new Array(300).fill(0));
  rxHistory = signal<number[]>(new Array(300).fill(0));
  txHistory = signal<number[]>(new Array(300).fill(0));

  // 🎭 Swagger Logic
  isSwaggerVisible = signal(false);
  swaggerStatus = signal<'loading' | 'success' | 'error'>('loading');
  swaggerErrorMessage = signal<string | null>(null);
  private isInitializing = false;
  private swaggerLoaded = false;
  isSwaggerCollapsed = signal(false);

  // 🔧 JS Debug Overlay State
  isJsDebugVisible = signal(true);
  isJsDebugCollapsed = signal(false);

  // 🌓 Theme Logic (Default to system preference or time-of-day)
  isDarkMode = signal(true);

  // 🗄️ Volume Monitor State
  isVolumesVisible = signal(true);
  isVolumesCollapsed = signal(false);

  // 📊 Process Monitor State
  isProcessVisible = signal(true);
  isProcessCollapsed = signal(false);

  // 📜 Live Diagnostic Logs (for catching transient engine errors)
  debugLogs = signal<{ msg: string; type: 'err' | 'warn' | 'log'; time: string }[]>([]);

  toggleTheme() {
    this.isDarkMode.update((v: boolean) => !v);
    localStorage.setItem('simulacrum-theme', this.isDarkMode() ? 'dark' : 'light');
  }

  toggleJsDebugCollapse() {
    this.isJsDebugCollapsed.update((v: boolean) => !v);
  }

  toggleJsDebugVisible() {
    this.isJsDebugVisible.update((v: boolean) => !v);
  }

  toggleVolumesCollapse() {
    this.isVolumesCollapsed.update((v: boolean) => !v);
  }

  toggleVolumesVisible() {
    this.isVolumesVisible.update(v => !v);
  }

  toggleProcessCollapse() {
    this.isProcessCollapsed.update(v => !v);
  }

  toggleProcessVisible() {
    this.isProcessVisible.update(v => !v);
  }

  toggleSwagger() {
    this.isSwaggerVisible.update((v: boolean) => !v);
    if (this.isSwaggerVisible() && !this.swaggerLoaded) {
      this.initSwagger();
    }
  }

  toggleSwaggerCollapse() {
    this.isSwaggerCollapsed.update(v => !v);
  }

  downloadSpec() {
    window.open('assets/openapi.yaml', '_blank');
  }

  async initSwagger() {
    if (this.swaggerLoaded || this.isInitializing) return;

    this.isInitializing = true;
    this.swaggerStatus.set('loading');
    this.swaggerErrorMessage.set(null);

    try {
      // 1. Proactive Validation Fetch
      const resp = await fetch('assets/openapi.yaml');
      if (!resp.ok) throw new Error(`Connectivity to Spec failed (${resp.status})`);
      const yamlText = await resp.text();
      if (yamlText.length < 10) throw new Error("Specification manifest is empty.");

      // 2. Library Injection & Global Namespace Guard
      const win = window as any;
      if (!win.SwaggerUIBundle) {
        const hasScript = document.getElementById('swagger-js-sdk');

        if (!hasScript) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.id = 'swagger-js-sdk';
          script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
          document.body.appendChild(script);

          const presetScript = document.createElement('script');
          presetScript.id = 'swagger-preset-sdk';
          presetScript.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
          document.body.appendChild(presetScript);

          await Promise.all([
            new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = () => reject(new Error("Bundle loading failed."));
            }),
            new Promise((resolve, reject) => {
              presetScript.onload = resolve;
              presetScript.onerror = () => reject(new Error("Preset loading failed."));
            })
          ]);
        } else {
          // Wait briefly if script exists but not yet executed
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // 3. Initialize Engine
      if (!win.SwaggerUIBundle) throw new Error("Swagger Bundle failed.");
      if (!win.SwaggerUIStandalonePreset) throw new Error("Swagger Preset failed.");

      // Robust resolution via document.baseURI (Handles Proxies/Port 81)
      const specUrl = new URL('assets/openapi.yaml', document.baseURI).href;

      win.SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          win.SwaggerUIBundle.presets.apis,
          win.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        onComplete: () => {
          // Verify rendering success with a small buffer for DOM paint
          setTimeout(() => {
            const hasError = document.querySelector('.errors-wrapper');
            const hasContent = document.querySelector('.swagger-ui');

            if (hasError) {
              this.swaggerStatus.set('error');
              this.swaggerErrorMessage.set("OAS Parser Error: Manifest structure is invalid.");
            } else if (!hasContent) {
              this.swaggerStatus.set('error');
              this.swaggerErrorMessage.set("Discovery failed: Rendering engine timeout.");
            } else {
              this.swaggerStatus.set('success');
              this.swaggerLoaded = true;
            }
            this.isInitializing = false;
          }, 150);
        }
      });

    } catch (e: any) {
      console.error('[Swagger] Critical Failure:', e);
      this.swaggerStatus.set('error');
      this.swaggerErrorMessage.set(e.message || "Technical Discovery Blocked.");
      this.isInitializing = false;
    }
  }

  // 🏥 Compute SVG Path for the CPU Lifeline
  lifelinePath = computed(() => {
    const data = this.cpuHistory();
    const width = 1000;
    const height = 100;
    const step = width / (data.length - 1);

    return data.map((val, i) => {
      const x = i * step;
      // Map 0-100% to height-10px to 10px (inverted for SVG)
      const y = height - (val / 100 * (height - 20) + 10);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  });

  // 📡 Compute Network Mini-Paths (Relative Scaling)
  netPaths = computed(() => {
    const rx = this.rxHistory();
    const tx = this.txHistory();
    const maxVal = Math.max(...rx, ...tx, 5); // At least 5Mbps for scale stability
    const width = 1000;
    const height = 40;
    const step = width / (rx.length - 1);

    const generatePath = (data: number[]) => data.map((val, i) => {
      const x = i * step;
      const y = height - (val / maxVal * (height - 6)) - 3;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

    return { rx: generatePath(rx), tx: generatePath(tx) };
  });

  constructor() {
    // 🛡️ Diagnostics: Capture console stream for UI monitor
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    const pushToLog = (args: any[], type: 'err' | 'warn' | 'log') => {
      const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const text = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg).slice(0, 500); } catch { return '[Complex Object]'; }
        }
        return String(arg);
      }).join(' ');

      this.debugLogs.update(prev => [{ msg: text, type, time }, ...prev].slice(0, 30));
    };

    console.error = (...args) => {
      pushToLog(args, 'err');
      originalError.apply(console, args);
    };
    console.warn = (...args) => {
      pushToLog(args, 'warn');
      originalWarn.apply(console, args);
    };

    // 🌓 Initialize Theme
    const storedTheme = localStorage.getItem('simulacrum-theme');
    if (storedTheme) {
      this.isDarkMode.set(storedTheme === 'dark');
    } else {
      const hour = new Date().getHours();
      // Auto-dark from 6 PM to 8 AM
      this.isDarkMode.set(hour < 8 || hour >= 18);
    }

    // Listen for errors separately to show a status message
    this.api.getLiveStats().subscribe({
      next: (stats) => {
        this.statsError.set(null);

        // 🧪 Initial Hydration: Load all 5-minute histories
        if (this.isFirstLoad) {
          this.isFirstLoad = false;

          const pad = (data: number[]) => {
            const padding = new Array(Math.max(0, 300 - (data?.length || 0))).fill(0);
            return [...padding, ...(data || [])].slice(-300);
          };

          this.cpuHistory.set(pad(stats.cpu_history));
          this.rxHistory.set(pad(stats.rx_history));
          this.txHistory.set(pad(stats.tx_history));

          // Pre-hydrate Heatmap with last 60s
          const recentHistory = stats.cpu_history.slice(-60).map((cpu, i) => ({
            ...stats, // Use current stats for other metrics since history only stores CPU/Net
            cpu_percent: cpu,
            net_rx_mbps: stats.rx_history.slice(-60)[i] || 0,
            net_tx_mbps: stats.tx_history.slice(-60)[i] || 0
          } as SystemStats));
          this.heartbeatBuffer.set(recentHistory);
          return;
        }

        // 📈 Standard Update: Shift and push all metrics
        this.cpuHistory.update(prev => [...prev.slice(1), stats.cpu_percent]);
        this.rxHistory.update(prev => [...prev.slice(1), stats.net_rx_mbps]);
        this.txHistory.update(prev => [...prev.slice(1), stats.net_tx_mbps]);

        // 🧬 Heatmap Update: Rolling 60s Buffer
        this.heartbeatBuffer.update(prev => {
          const next = [...prev, stats];
          return next.length > 60 ? next.slice(-60) : next;
        });
      },
      error: (err) => {
        console.error('[AppComponent] Stats Error:', err);
        this.statsError.set('Lost connection to Synology API');
      }
    });

    // 🕒 Auto-disable Frenzy Mode after 15 seconds
    setTimeout(() => this.isFrenzy.set(false), 15000);
  }
}