# Simulacrum Telemetry Client

### 🧬 High-Fidelity System Diagnostic Dashboard

Simulacrum is a professional, modern telemetry interface designed to provide real-time visibility into distributed hardware and service health. By bridging a high-performance **C++ Stats Engine** with a sleek **Angular 19+** frontend, Simulacrum delivers a "Glassmorphism" inspired monitoring experience that is both technically robust and visually premium.

---

## 🏗️ Technical Architecture

Simulacrum follows a "Heartbeat & Brain" architecture:

-   **The Heartbeat (C++ Statistics Engine)**: A high-performance, containerized backend running on a Synology NAS. It directly interacts with the Linux kernel `/proc` and `/sys` filesystems to track hardware interrupts, disk I/O, and CPU load with minimal overhead.
-   **The Brain (Angular Frontend)**: A reactive Angular 19+ application that orchestrates complex UI states, including dynamic HSL-based theme switching (Light/Dark) and an adaptive layout system that shifts between "Floating Overlays" and "Sequential Flow" based on screen real estate.

---

## 📊 Orchestrated Features

### 🖥️ Adaptive Monitoring Overlays
Simulacrum employs a sophisticated positioning system that adapts to your environment:
-   **Volumes Monitor (Focal Point)**: Located in the center for high-visibility disk tracking across 7+ storage volumes (Bern/Zurich timezone synced).
-   **Process Monitor**: A dedicated task tracking overlay allowing real-time inspection of high-impact PIDs, CPU%, and Memory footprints.
-   **Diagnostic Monitor ([SYS_LOG])**: Integrated JS debugger and raw JSON API response viewer for hardware-level troubleshooting.

### 🧬 System DNA Card
A dedicated landscape-form information card that tracks the project-level tech stack (Angular 19+, C++ 17/20, Ansible/Docker) and current heartbeat connectivity status.

### 📜 API Discovery Service
Fully integrated **Swagger UI** environment. Explore, test, and download the full OpenAPI 3.0 specification directly from the dashboard, synchronized with the C++ backend manifest.

---

## 🚀 Infrastructure & Deployment

The system is deployed via a highly modular **Ansible Orchestration Pipeline**:

-   **Hybrid Target Architecture**:
    -   **Back-End**: Dockerized deployment on **Synology NAS (Port 8080)** with host-filesystem mounting (`/proc`, `/sys`).
    -   **Front-End**: Node.js & PM2 managed deployment on **IONOS Webserver (Port 3001)** via Co-existence Mode.
-   **Timezone Synchronization**: All telemetry timestamps are strictly synchronized to **Europe/Zurich (Bern)** for accurate incident tracking and logging.

---

## 🛠️ Development & Build

### Installation
```bash
npm install
```

### Local Development
To launch the development server (default: `http://localhost:4200/`):
```bash
ng serve
```

### Automated Deployment
Simulacrum utilizes automated PowerShell/WSL scripts for rapid full-stack updates:
```powershell
.\deploy.ps1      # Update IONOS Client
.\push-nd-run.sh  # Update NAS Backend (from cpp-api-server root)
```

---

*&copy; 2026 Antoine Falempin | Orchestrated via Ansible & IONOS IaaS*
