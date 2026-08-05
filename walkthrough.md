# CryptoSphere MVP Implementation Walkthrough

We have successfully built the **CryptoSphere** MVP from scratch. The codebase follows strict Clean Architecture guidelines, features modular organization, is fully typed, and integrates the CoinGecko API with a robust in-memory caching system to handle API rate limits.

---

## 🚀 Accomplishments

### 1. Backend API (FastAPI, Motor, Beanie ODM, PyJWT)
*   **Modular Architecture**: Isolated layers: API (Routing), Services (Domain/Business logic), Repositories (Data mapping/DB queries), Document Models, and Pydantic Schemas.
*   **Whitelisting Auth & Seeder**: Google ID token authentication checks. On first DB boot, the application seeds `authorised_users` with the 4 default whitelisted emails from `config.py`.
*   **Simulation Trading Engine**: Mathematical calculations for portfolio values, cost-basis cost averages on BUYs, realized/unrealized profit-losses, and cash deposits/withdrawals.
*   **CoinGecko Caching**: Multi-tier in-memory cache to stay within Free Tier limits. Provides database fallback logic if external APIs respond with `429 Rate Limited`.

### 2. Frontend Client (React, Vite, TS, Tailwind CSS)
*   **Glassmorphic Design**: Sleek dark layout matching the premium aesthetics request.
*   **Google One-Tap Auth**: Google Authentication client script integrated.
*   **Mock sandbox mode**: Whitelisted credential quick logins provided in `Login.tsx` for easy developer validation.
*   **Recharts Visuals**: Portfolio growth curves and historical rates charts.
*   **TanStack Query State Sync**: Syncs live market rates every 30 seconds.

---

## 📂 Core Codebase Layout

Click on the links below to inspect key code structures:

### Backend Key Files
*   [main.py](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/backend/app/main.py) — Application factory and lifespan hooks.
*   [config.py](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/backend/app/core/config.py) — Whitelisted emails and settings.
*   [auth_service.py](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/backend/app/services/auth_service.py) — Verification and whitelisting. Includes mock token support for local testing.
*   [market_service.py](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/backend/app/services/market_service.py) — Resilient caching client for CoinGecko.
*   [portfolio_service.py](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/backend/app/services/portfolio_service.py) — P&L aggregation and cost-basis calculator.
*   [wallet_service.py](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/backend/app/services/wallet_service.py) — Virtual cash deposits/withdrawals.

### Frontend Key Files
*   [App.tsx](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/frontend/src/App.tsx) — Routes maps and providers.
*   [Login.tsx](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/frontend/src/pages/Login.tsx) — Google & mock login UI.
*   [Dashboard.tsx](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/frontend/src/pages/Dashboard.tsx) — Market summary and KPI views.
*   [Portfolio.tsx](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/frontend/src/pages/Portfolio.tsx) — simulated holdings table and trade action panel.
*   [Wallet.tsx](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/frontend/src/pages/Wallet.tsx) — simulated funding.
*   [Settings.tsx](file:///c:/Users/kshit/Desktop/Vikas/Crypto%20Antigravity/frontend/src/pages/Settings.tsx) — Display settings and currency.

---

## 🛠️ Verification & Compile Checks

We performed compilation checks to verify the code:

1.  **Frontend TypeScript**:
    Run inside `frontend/` directory:
    ```powershell
    npx tsc
    ```
    *Result*: Compiled with **zero errors**.
2.  **Backend Python Imports**:
    Run inside `backend/` directory:
    ```powershell
    python -c "import app.main; print('Success')"
    ```
    *Result*: Responded with `Success`, proving all routing dependencies, service layers, and validation schemas compile.

---

## 🖥️ How to Run Locally

To test the application locally, start the database, backend dev server, and frontend client:

### 1. Pre-requisites
Ensure MongoDB is running locally on port `27017` (or provide a remote connection string in the backend `.env` file).

### 2. Run the Backend API
Navigate to the `backend/` folder:
```powershell
# Set up virtual environment if desired, then:
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
This starts the backend dev server at `http://localhost:8000`. It will automatically connect to MongoDB and seed the authorized users.

### 3. Run the Frontend Client
Navigate to the `frontend/` folder:
```powershell
npm install
npm run dev
```
This launches the React Vite interface at `http://localhost:5173`.

### 4. Sandbox Quick Login Testing
*   Open the browser to `http://localhost:5173/login`.
*   A **Developer Sandbox Bypass** panel is loaded at the bottom.
*   Click on any of the whitelisted accounts (e.g. `user1@example.com`).
*   The backend validates the token, registers the user, seeds a default virtual wallet with **$100,000.00 cash**, and routes you to the main dashboard.
