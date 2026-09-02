# Cyber Risk Quantification & Investment Optimization Platform

**SIH Problem Statement 26105**

An enterprise-grade, **FAIR-aligned** Cyber Risk Quantification (CRQ) and decision-support platform. It converts raw technical cybersecurity telemetry (vulnerabilities, threat events, deployed controls) into **defensible financial risk metrics** — Expected Annual Loss (EAL), Value at Risk (VaR95 / VaR99), and Return on Security Investment (ROSI) — enabling CISOs, risk officers, and executive leadership to make data-driven, budget-constrained security investment decisions instead of relying on qualitative "Low/Medium/High" risk heatmaps.

---

## System Architecture

```
SIH2026/
├── backend/                  # FastAPI + FAIR Monte Carlo Risk Engine + ILP Optimizer
│   ├── api/
│   │   ├── main.py           # Core REST API (endpoints for risk metrics & optimizer)
│   │   └── chat.py           # /chat endpoint with AI RAG context-stuffing
│   ├── risk_engine/          # FAIR Monte Carlo simulation & PuLP ILP knapsack solver
│   │   ├── ingest.py         # CSV ingestion & asset base table creation
│   │   ├── likelihood.py     # EPSS annualization & CVSS vulnerability factor
│   │   ├── frequency.py      # Threat Event Frequency (TEF) modeling
│   │   ├── loss_magnitude.py # Primary & Secondary lognormal loss calibration
│   │   ├── simulate.py       # Vectorized Monte Carlo simulation engine
│   │   ├── aggregate.py      # EAL, VaR95, VaR99 calculation & rollups
│   │   ├── control_scenarios.py # Before/after control ROSI simulations
│   │   ├── investment_optimizer.py # Knapsack ILP vs greedy solver
│   │   └── config.py         # Tunable mathematical parameters & benchmarks
│   ├── data/                 # Relational cybersecurity telemetry dataset (5 CSVs)
│   ├── outputs/              # Quantified risk parquet datasets (EAL, VaR95, VaR99, ROSI)
│   ├── tests/                # Pytest validation test suite
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment template (HF_TOKEN)
│
├── frontend/                 # React 18 + Vite + TailwindCSS + Recharts Dashboard
│   ├── src/
│   │   ├── api/client.js     # Axios API client & financial formatters
│   │   ├── hooks/useApi.js   # Centralized data fetching, loading & error hook
│   │   ├── components/
│   │   │   ├── dashboard/    # ExecutiveSummary, BusinessUnitChart, AssetRiskTable,
│   │   │   │                 # AssetDetailPanel, ControlsROIChart, WhatIfOptimizer
│   │   │   ├── chatbot/      # ChatWidget, ChatWindow, ChatMessage, BotLogo
│   │   │   └── layout/       # Header, navigation tabs, health monitor
│   │   ├── App.jsx           # Dashboard root
│   │   └── index.css         # Tailwind & custom styling
│   ├── package.json
│   └── .env.example          # VITE_API_BASE_URL=http://localhost:8000
│
└── README.md
```

---

## Dataset (`backend/data/`)

A simulated, relational dataset representing the technical telemetry and business context required to model cyber risk financially — 5 interconnected CSV files:

### 1. `assets.csv` — Business Context
`asset_id, hostname, business_unit, criticality (1-5), data_sensitivity_tier, financial_value_usd, downtime_cost_per_hour_usd, regulatory_penalty_potential_usd, os`
Defines the intrinsic value and potential loss magnitude (in USD) if an asset is compromised.

### 2. `vulnerabilities.csv` — Technical Weaknesses
`vuln_id, asset_id (FK), cve_id, cvss_score, epss_score, severity, status, discovery_date`
Feeds the Likelihood and Vulnerability-factor calculations. `epss_score` (FIRST.org's Exploit Prediction Scoring System) provides a real, externally-maintained probability of exploitation — not a guess.

### 3. `threat_events.csv` — Historical Incident Data
`event_id, timestamp, asset_id (FK), mitre_technique_id, description, severity, source_ip, action_taken, downtime_hours_caused, records_compromised`
Simulated SIEM-style alert log providing the empirical basis for Threat Event Frequency and for downtime/records-exposed inputs to Loss Magnitude.

### 4. `controls.csv` — Mitigation Catalog
`control_id, name, risk_reduction_pct, cost_usd`
The catalog of available security defenses (MFA, EDR, Network Segmentation, Patching) with their cost and effectiveness — the cost-benefit inputs for the optimization module.

### 5. `asset_controls.csv` — Deployed Defenses
`mapping_id, asset_id (FK), control_id (FK), status, deployment_date`
Maps which controls are currently active on which assets — required to compute *residual* risk (risk after existing defenses), not raw/unmitigated risk.

---

## Risk Calculation Engine (`backend/risk_engine/`)

The engine implements an **Open FAIR™-aligned, Monte Carlo-based** methodology where every formula is traceable to source data or external standards (such as FIRST.org and Open FAIR), ensuring auditability for regulatory compliance (e.g., RBI/SEBI/NIST frameworks).

### Pipeline Stages

1. **Ingestion & Normalization (`ingest.py`)**:
   Joins the 5 raw CSVs into a single `asset_risk_base` table keyed on `asset_id` — one row per asset with aggregated vulnerability lists, event counts, and active controls.

2. **Likelihood (`likelihood.py`)**:
   - **EPSS annualization**: EPSS scores a 30-day window. The engine annualizes it via the survival-probability formula:
     $$\text{P\_annual} = 1 - (1 - \text{EPSS\_30day})^{\frac{365}{30}}$$
   - **CVSS normalization**: $\text{severity\_norm} = \frac{\text{cvss\_score}}{10}$, kept as an orthogonal 0–1 dimension from probability.
   - **Vulnerability factor**: Combines annualized exploit probability, severity, and active control resistance per CVE, taking the **maximum across an asset's CVEs** (weakest link principle):
     $$\text{control\_resistance} = \min(1, \text{total\_risk\_reduction\_pct})$$
     $$\text{vuln\_per\_cve} = P_{\text{annual\_exploit}} \times \text{severity\_norm} \times (1 - \text{control\_resistance})$$
     $$\text{Vuln\_asset} = \max_{\text{cve} \in \text{asset}} (\text{vuln\_per\_cve})$$

3. **Threat Event Frequency — TEF (`frequency.py`)**:
   Derived empirically from `threat_events.csv` as a **triangular distribution** ($\text{TEF}_{\text{min}}, \text{TEF}_{\text{ml}}, \text{TEF}_{\text{max}}$). If an asset has $<3$ historical events, its business unit's aggregate event-rate distribution is borrowed.

4. **Loss Magnitude (`loss_magnitude.py`)**:
   - **Primary Loss** (Internal): $\text{downtime\_cost\_per\_hour} \times \text{downtime\_hours} + \text{IR\_flat\_cost}$
   - **Secondary Loss** (Benchmark-calibrated): $\text{sensitivity\_multiplier} \times \text{per\_record\_cost} \times \text{records\_compromised} + \text{regulatory\_penalty}$
   - Combined into a **lognormal distribution** ($\sigma=0.75$, configurable) to accurately reflect right-skewed heavy tail losses.

5. **Monte Carlo Simulation (`simulate.py`)**:
   Vectorized (NumPy) simulation running thousands of iterations per asset:
   ```python
   tef_sample  = triangular(TEF_min, TEF_ml, TEF_max)
   vuln_sample = beta(a, b)                          # mean ≈ Vuln_asset
   lef_sample  = poisson(tef_sample * vuln_sample)   # Loss Event Frequency
   annual_loss = lef_sample * loss_magnitude_sample  # per iteration
   ```

6. **Aggregation & Summary Metrics (`aggregate.py`)**:
   - **EAL** (Expected Annual Loss): Mean of the distribution ("typical year" loss).
   - **VaR95 / VaR99** (Value at Risk): 95th and 99th percentiles ("bad year" and catastrophic tail loss).
   - **Priority Score**: $\text{priority\_score} = \text{EAL} \times (\text{criticality} / 5)$ for visual ranking.

7. **Control Scenario Simulation (`control_scenarios.py`)**:
   For every candidate control not already deployed on an asset, the engine re-runs the simulation twice:
   $$\text{Risk\_Reduction\_usd} = \text{EAL}_{\text{before}} - \text{EAL}_{\text{after}}$$
   $$\text{ROSI} = \frac{\text{Risk\_Reduction\_usd}}{\text{cost\_usd}}$$

8. **Investment Optimizer (`investment_optimizer.py`)**:
   Solves the budget-constrained knapsack problem using Integer Linear Programming (PuLP / CBC solver) to select the optimal set of asset-control pairs, comparing directly against a naive greedy-by-ROSI baseline.

---

## Outputs (`backend/outputs/`)

| File | Contents |
|---|---|
| `asset_risk_summary.parquet` | Per-asset EAL, VaR95, VaR99, criticality, priority score, Loss Exceedance Curve (LEC) |
| `business_unit_risk_summary.parquet` | Aggregated EAL, VaR95 upper bound, and top risk-driving assets per BU |
| `org_risk_summary.parquet` | Organization-wide aggregated EAL, VaR95, and VaR99 |
| `control_scenario_results.parquet` | Every candidate control $\times$ asset pair: cost, EAL before/after, risk reduction, ROSI |

---

## API Endpoints (`backend/api/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API status check |
| `GET` | `/risk/organization` | Top-level enterprise risk metrics (EAL, VaR95, VaR99) |
| `GET` | `/risk/business-units` | Aggregated risk metrics per business unit |
| `GET` | `/risk/assets` | Risk summaries for all assets |
| `GET` | `/risk/assets/{asset_id}` | Detailed asset metrics & Loss Exceedance Curve array |
| `GET` | `/controls/roi` | All controls ranked by Return on Security Investment |
| `GET` | `/controls/scenarios` | Full candidate control $\times$ asset simulation results |
| `GET` | `/controls/optimize?budget=X` | Knapsack ILP optimizer for budget-constrained security investments |
| `POST` | `/chat` | Conversational AI Copilot grounded in live risk parquet data |

---

## Key Modeling Standards & Credibility

| Model Component | External Standard / Benchmark |
|---|---|
| Vulnerability Likelihood | EPSS (FIRST.org Exploit Prediction Scoring System) |
| Technical Severity | CVSS v3.1 (FIRST.org / NIST NVD) |
| Risk Framework | Open FAIR™ (The Open Group Standard) |
| Loss Calibration | IBM / Ponemon Institute Cost of a Data Breach Report |
| Simulation Method | Vectorized Monte Carlo (Triangular, Beta, Poisson, Lognormal) |
| Optimization Solver | 0-1 Knapsack Integer Linear Programming (PuLP / COIN-OR CBC) |

---

## Key Dashboard Features

1. **Executive Summary**: Real-time enterprise Expected Annual Loss (EAL), Value at Risk 95% (1-in-20 yr loss threshold), and Value at Risk 99% (catastrophic tail risk).
2. **Business Unit Risk Breakdown**: Interactive visual comparison of risk exposure across Business Units with VaR upper-bound tooltips.
3. **Asset Risk Portfolio**: Sortable, searchable asset inventory with visual highlights on top risk contributors and single-asset Loss Exceedance Curve (LEC) drawers.
4. **Controls ROI Analysis**: Quantified ROSI ranking defense-in-depth mitigations by financial risk reduction per dollar spent.
5. **Interactive What-If Optimizer**: Knapsack ILP solver that computes optimal asset-to-control allocations for custom budgets ($0 to $2M+) and demonstrates mathematical superiority over greedy heuristics.
6. **AI Risk Copilot (Chatbot)**: Floating Copilot widget grounded in live FAIR risk parquet data via context injection.

---

## All Commands in One Place

### 1. Initial Setup & Dependencies

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# Windows (CMD):
python -m venv venv
venv\Scripts\activate.bat

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env configuration
# Windows:
Copy-Item .env.example .env
# Linux / macOS:
cp .env.example .env
```

#### Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Create frontend .env configuration
# Windows:
Copy-Item .env.example .env
# Linux / macOS:
cp .env.example .env
```

---

### 2. Dataset & Risk Pipeline Execution

```bash
# (Optional) Regenerate simulated telemetry CSVs:
python scripts/generate_dataset.py

# Run the end-to-end FAIR Monte Carlo risk quantification pipeline:
python -m risk_engine.pipeline

# Run the automated Pytest test suite:
python -m pytest tests/ -v
```

---

### 3. Running the Full Stack Application

#### Start Backend Server
```bash
# Inside backend/ with venv activated:
uvicorn api.main:app --reload --port 8000
```
- **REST API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

#### Start Frontend Dashboard
```bash
# Inside frontend/ directory:
npm run dev
```
- **Live Dashboard**: [http://localhost:5173](http://localhost:5173)
