# KRISHi-EYE Local Windows Development Setup

This repository contains the full KRISHi-EYE intelligence platform. It leverages a Next.js (App Router) frontend, a NestJS backend API, and a highly resilient PostgreSQL database extended with **PostGIS** for processing live hardware telemetry (tractors/sprayers).

Because KRISHi-EYE relies on advanced spatial geometry calculations (`Unsupported("geography")` WKT POINTS), **Docker Desktop is strictly required for local development**. Lightweight SQLite fallbacks are unsupported for the telemetry ingestion pathways to ensure 100% production parity.

---

## 🛑 1. Prerequisites

Before cloning or bringing up the environment, ensure you have the following installed on Windows:
1. **Node.js**: v20 or higher.
2. **Python**: 3.x (to run optional simulation tools).
3. **Docker Desktop**: [Download Here](https://www.docker.com/products/docker-desktop/). **Ensure WSL2 integration is enabled and the daemon is running.**

---

## 🩺 2. Environment Preflight (Doctor)

We have provided a robust preflight check to ensure your environment is healthy before boot. Open an elevated PowerShell terminal in the repository root and run:

```powershell
.\scripts\doctor.ps1
```

If any checks fail (e.g., Docker is missing, or port `3000` is blocked), follow the yellow **Remediation** instructions printed in the console before proceeding.

---

## 🚀 3. One-Command Bootstrap

Once the doctor is green, you can bring up the entire environment (Database, Prisma Migrations, Frontend Web App, and Backend API) with a single command:

```powershell
.\scripts\dev-up.ps1
```

**What this does:**
1. Calls `docker compose up -d` to spin up the local `postgis/postgis:16-3.4` database on port `5432`.
2. Syncs the Prisma schema using `npx prisma db push --accept-data-loss`.
3. Forks two PowerShell jobs to start the NestJS API on port `3000` and Next.js frontend on port `3001`.

*(Note: Keep this terminal open! Press `Ctrl+C` to terminate the cluster when finished).*

---

## 🧪 4. Live Telemetry Testing

KRISHi-EYE receives live edge IoT data (from Raspberry Pi 5 sensors) via REST. To simulate a tractor maneuvering through a field locally without real hardware:

1. **Log in:** Open `http://localhost:3001` in your browser. Enter mobile number `+919999999999` and OTP `123456` to access your dashboard.
2. **Create Context:** In the Web UI, ensure you have created at least one Farm, one Tractor, and an active Spraying Operation Job.
3. **Trigger Telemetry:** Open a new PowerShell terminal and run our synthetic hardware loop:
   ```powershell
   .\scripts\test-telemetry.ps1
   ```
   *(Or alternatively, using Python: `python scripts/simulate_telemetry.py`)*
4. **Observe the Client:** Return to `http://localhost:3001/dashboard/map`. The map utilizes WebSockets to listen to hardware broadcasts from the NestJS layer. You will observe the tractor path mapping itself onto the field live in real-time.

---

## ⚠️ Common Failures & Fixes

### ❌ `PrismaClientInitializationError: P1000`
**Cause:** The backend API started, but the PostgreSQL database is unreachable.
**Fix:** Open Docker Desktop. Ensure the `krishi-eye-db` container is running and healthy. Ensure `apps/api/.env` points to `postgresql://postgres:password@localhost:5432/krishi_eye?schema=public`.

### ❌ `Connection Refused` on Ports `3000` or `3001`
**Cause:** Node services crashed or didn't start.
**Fix:** Run `.\scripts\doctor.ps1` to ensure the ports aren't blocked by other background processes.

### ❌ `test-telemetry.ps1` fails with "No active jobs found..."
**Cause:** Telemetry logic is rigorously tenant-isolated and job-validated; you cannot spray random coordinates.
**Fix:** You must create an active Operation Job linked to a Tractor in the Web Dashboard first.
