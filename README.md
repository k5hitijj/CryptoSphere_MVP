# 🌐 CryptoSphere MVP
> Private Market Intelligence & Portfolio Management Portal.

CryptoSphere is a premium, glassmorphic paper-trading and portfolio management dashboard built with React (TypeScript) and FastAPI (Python), backed by MongoDB Atlas and Beanie ODM.

---

## 🚀 Key Features

*   **🔒 Whitelisted OAuth & Developer Sandbox**: Google Sign-In with strict admin email whitelisting. Sandbox developer bypass for rapid local testing.
*   **📊 Live Market Analytics**: Interactive charting terminal tracking top-50 cryptocurrencies with custom range selectors (1D to 1Y) and price/volume charts.
*   **💼 Virtual Portfolio Ledger**: Track holdings value, average buy prices, cost basis, and real-time Profit & Loss percentages.
*   **💳 Plaid Bank Connection Simulator**: Secure multi-step verification process to link international banking groups (Revolut, HSBC, Barclays, Citi, etc.) with SWIFT/routing validation.
*   **💸 P2P Asset Transfers**: Secure transfer ledger allowing whitelisted users to send cash balances or holdings directly to other registered emails.
*   **🔔 Real-Time Price Alerts**: Push-alert configurations that scan market prices and display custom glassmorphic toasts when target thresholds are triggered.

---

## 📁 Repository Structure

```
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API route controllers
│   │   ├── core/             # JWT, Auth config, & Settings loading
│   │   ├── database/         # MongoDB Atlas connectivity
│   │   ├── models/           # Beanie document models
│   │   └── services/         # Business domain logic (funding, transfers, alerts)
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Local backend secrets (Ignored in git)
│
├── frontend/                 # Vite React Single Page Application
│   ├── src/
│   │   ├── components/       # Layouts & UI widgets
│   │   ├── pages/            # View pages (Terminal, Wallet, Alerts)
│   │   └── services/         # Axios API client
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript configuration
│
└── vercel.json               # Monorepo build and serverless deployment bindings
```

---

## 💻 Local Installation & Setup

### 1. Prerequisites
*   Python 3.10+
*   Node.js 18+
*   MongoDB Atlas cluster

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory:
   ```env
   PROJECT_NAME="CryptoSphere API"
   JWT_SECRET_KEY="generate-a-secure-random-string"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   MONGODB_URL="your-mongodb-atlas-connection-string"
   DATABASE_NAME="cryptosphere"
   COINGECKO_API_KEY="your-coingecko-api-key"
   CORS_ORIGINS=["http://localhost:5173"]
   WHITELISTED_EMAILS=["admin@example.com"]
   ```
5. Start the development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Vercel Deployment (All-on-Vercel Serverless)

The repository is pre-configured to build and deploy both the React static assets and Python serverless functions automatically using Vercel CLI or GitHub integration:

1. Push your changes to your Git repository.
2. Link the repository to your Vercel Account.
3. Configure the **Environment Variables** in Vercel settings corresponding to the backend `.env` variables list.
4. Click **Deploy**. Vercel will handle the path configurations and serverless ASGI translations automatically!
