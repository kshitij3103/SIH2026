# AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform

**SIH Problem Statement 26105**

A board-ready platform that quantifies cyber risk in **financial terms** (not qualitative "High/Medium/Low" scores), using an **Open FAIR™-aligned Monte Carlo engine**, and recommends the mathematically optimal allocation of a security budget across controls via an **Integer Linear Programming (ILP) knapsack optimizer**. Includes a RAG-grounded chat assistant for board/stakeholder Q&A over the live risk data.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Risk Calculation Engine](#risk-calculation-engine-backendrisk_engine)
- [Investment Optimizer](#investment-optimizer)
- [AI Chat Assistant](#ai-chat-assistant)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Model Limitations](#model-limitations)

---

## Overview

Most cyber risk dashboards stop at qualitative heat maps. This platform goes further:

- Every asset's risk is expressed as a **distribution of possible annual financial loss** (Expected Annual Loss, VaR95, VaR99) via 10,000-iteration Monte Carlo simulation.
- Every control's value is expressed as a **Return on Security Investment (ROSI)**.
- Budget allocation across controls is solved as a **true combinatorial optimization problem**, not a greedy heuristic — with a side-by-side comparison showing the dollar value the exact solver captures over naive prioritization.
- A grounded chat assistant lets stakeholders ask natural-language questions and get answers sourced strictly from the computed risk data (with live optimizer runs for budget questions, not LLM guesses).

## Key Features

- 📊 **Executive Overview** — organization-wide EAL, VaR95, VaR99 with exceedance probabilities
- 🗂️ **Asset Portfolio** — per-asset EAL/VaR, criticality, priority score, filterable by business unit
- 🛡️ **Investment Optimizer** — Knapsack ILP solver vs. naive greedy baseline, with recommended (asset, control) action plan
- 💬 **AI Risk Analyst Chatbot** — RAG-grounded Q&A over live risk data, with real ILP invocation for budget questions
- 🧮 **Standards-based methodology** — every formula traceable to FIRST.org EPSS/CVSS, Open FAIR, and cited breach-cost benchmarks

## Architecture

```
                        ┌─────────────────────────┐
                        │   Frontend Dashboard     │
                        │ (Executive / Assets /    │
                        │  Optimizer / Chat panel) │
                        └────────────┬─────────────┘
                                     │ REST (JSON)
                        ┌────────────▼─────────────┐
                        │   FastAPI Backend (api/)  │
                        │  main.py — REST endpoints │
                        │  chat.py — RAG chat route │
                        └────────────┬─────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
        ┌────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │  risk_engine/   │ │ investment_       │ │  Hugging Face     │
        │  Monte Carlo    │ │ optimizer.py      │ │  Router (LLM)     │
        │  FAIR pipeline  │ │  (ILP / Knapsack) │ │  DeepSeek model    │
        └────────┬────────┘ └────────┬─────────┘ └──────────────────┘
                 │                   │
                 ▼                   ▼
        ┌─────────────────────────────────────┐
        │   outputs/*.parquet                  │
        │   org_risk_summary, business_unit_,  │
        │   asset_risk_summary,                │
        │   control_scenario_results           │
        └───────────────────────────────────────┘
```

## Risk Calculation Engine (`backend/risk_engine/`)

The engine implements an **Open FAIR™-aligned, Monte Carlo-based** methodology where every formula is traceable to source data or external standards (such as FIRST.org and Open FAIR), ensuring auditability for regulatory compliance (e.g., RBI/SEBI/NIST frameworks).

### Pipeline Stages

1. **Ingestion & Normalization (`ingest.py`)**
   Joins the 5 raw CSVs into a single `asset_risk_base` table keyed on `asset_id` — one row per asset with aggregated vulnerability lists, event counts, and active controls.

2. **Likelihood (`likelihood.py`)**

   - **EPSS annualization**: EPSS scores a 30-day window. The engine annualizes it via the survival-probability formula:

     $$
     P_{\text{annual}} = 1 - (1 - \text{EPSS}_{30\text{day}})^{\frac{365}{30}}
     $$

   - **CVSS normalization**:

     $$
     \text{severity}_{\text{norm}} = \frac{\text{CVSS}_{\text{score}}}{10}
     $$

     Kept as an orthogonal 0–1 dimension from probability.

   - **Vulnerability factor**: Combines annualized exploit probability, severity, and active control resistance per CVE, taking the **maximum across an asset's CVEs** (weakest link principle):

     $$
     \text{control}_{\text{resistance}} = \min\left(1, \text{total risk reduction}_{\%}\right)
     $$

     $$
     \text{vuln}_{\text{per-CVE}} = P_{\text{annual exploit}} \times \text{severity}_{\text{norm}} \times (1 - \text{control}_{\text{resistance}})
     $$

     $$
     \text{Vuln}_{\text{asset}} = \max_{\text{CVE} \in \text{asset}} \left(\text{vuln}_{\text{per-CVE}}\right)
     $$

3. **Threat Event Frequency — TEF (`frequency.py`)**
   Derived empirically from `threat_events.csv` as a **triangular distribution**:

   $$
   \text{TEF}_{\text{min}}, \quad \text{TEF}_{\text{ml}}, \quad \text{TEF}_{\text{max}}
   $$

   If an asset has fewer than 3 historical events, its business unit's aggregate event-rate distribution is borrowed.

4. **Loss Magnitude (`loss_magnitude.py`)**

   - **Primary Loss** (Internal):

     $$
     \text{Primary Loss} = (\text{downtime cost per hour} \times \text{downtime hours}) + \text{IR flat cost}
     $$

   - **Secondary Loss** (Benchmark-calibrated):

     $$
     \text{Secondary Loss} = (\text{sensitivity multiplier} \times \text{per-record cost} \times \text{records compromised}) + \text{regulatory penalty}
     $$

   - Combined into a **lognormal distribution** ($\sigma = 0.75$, configurable) to accurately reflect right-skewed, heavy-tail losses.

5. **Monte Carlo Simulation (`simulate.py`)**
   Vectorized (NumPy) simulation running thousands of iterations per asset:

   ```python
   tef_sample  = triangular(TEF_min, TEF_ml, TEF_max)
   vuln_sample = beta(a, b)                          # mean ≈ Vuln_asset
   lef_sample  = poisson(tef_sample * vuln_sample)   # Loss Event Frequency
   annual_loss = lef_sample * loss_magnitude_sample  # per iteration
   ```

   Outputs are aggregated into `org_risk_summary.parquet`, `business_unit_risk_summary.parquet`, and `asset_risk_summary.parquet` — each carrying `EAL_usd`, `VaR95_usd`, `VaR99_usd`, and a `priority_score`.

## Investment Optimizer

`risk_engine/investment_optimizer.py` solves a **budget-constrained knapsack problem** using Integer Linear Programming (`pulp`):

- **Inputs**: `control_scenario_results.parquet` (per asset-control pair: `cost_usd`, `Risk_Reduction_usd`), a budget in USD, and a `one_control_per_asset` constraint flag.
- **Objective**: maximize total risk reduction subject to the budget constraint.
- **Output**: the exact-optimal set of (asset, control) actions, `total_cost_usd`, `total_risk_reduction_usd`, `residual_eal_usd`, and a `greedy_comparison` showing the dollar value gained over a naive "sort by ROSI and take greedily" baseline.

Exposed via `GET /controls/optimize?budget=<usd>&one_control_per_asset=<bool>`.

## AI Chat Assistant

`api/chat.py` implements a RAG-style assistant over the live risk data:

- On every request, it rebuilds context from the org/business-unit/asset/control parquet outputs (top 15 assets by EAL, top 10 controls by ROSI) and injects it into the system prompt.
- If the user's message contains a budget figure (e.g. *"if I allocate $750k..."*), it **runs the real ILP optimizer** (the same function backing `/controls/optimize`) and injects the actual solver output into context — the model is instructed to cite those numbers directly rather than computing budget allocation itself.
- Responses are generated via the Hugging Face Inference Router (`deepseek-ai/DeepSeek-V4-Flash-0731`), using the OpenAI-compatible `/v1/chat/completions` API.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI, Pydantic, Uvicorn |
| Risk engine | NumPy, SciPy, pandas, PyArrow (parquet I/O) |
| Optimizer | PuLP (ILP / knapsack solver) |
| Chat / RAG | OpenAI SDK → Hugging Face Inference Router → DeepSeek |
| Config | python-dotenv |
| Testing | pytest |

## Project Structure

```
backend/
├── api/
│   ├── main.py               # FastAPI app, REST endpoints
│   └── chat.py                # RAG chat endpoint
├── risk_engine/
│   ├── ingest.py
│   ├── likelihood.py
│   ├── frequency.py
│   ├── loss_magnitude.py
│   ├── simulate.py
│   ├── investment_optimizer.py
│   └── pipeline.py            # orchestrates the full run
├── outputs/                    # generated parquet files
│   ├── org_risk_summary.parquet
│   ├── business_unit_risk_summary.parquet
│   ├── asset_risk_summary.parquet
│   └── control_scenario_results.parquet
├── requirements.txt
└── .env
```

## Getting Started

### Prerequisites
- Python 3.10+
- A Hugging Face API token (`HF_TOKEN`) for the chat assistant

### Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configure environment

Create `backend/.env`:

```
HF_TOKEN=your_huggingface_token_here
```

### Run the risk pipeline

```bash
python -m risk_engine.pipeline
```

This generates the parquet files under `outputs/` that the API and chatbot both read from.

### Start the API

```bash
uvicorn api.main:app --reload
```

API docs available at `http://localhost:8000/docs`.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/risk/organization` | Top-level enterprise risk metrics |
| `GET` | `/risk/business-units` | Aggregated risk per business unit |
| `GET` | `/risk/assets` | Risk metrics for all assets |
| `GET` | `/risk/assets/{asset_id}` | Detailed risk for one asset (incl. loss exceedance curve) |
| `GET` | `/controls/scenarios` | All control what-if scenarios |
| `GET` | `/controls/roi` | Controls ranked by overall ROSI |
| `GET` | `/controls/optimize?budget=<usd>` | Optimal budget allocation (ILP) vs. greedy baseline |
| `POST` | `/chat` | RAG chat assistant over live risk data |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HF_TOKEN` | Yes | Hugging Face API token used by `api/chat.py` for the chat assistant |

## Model Limitations

Documented transparently for auditability:

- **Correlated-loss risk**: the current Monte Carlo simulation treats asset-level loss events as independent; it does not yet model correlated/cascading failure across assets in the same business unit or shared infrastructure.
- **EPSS/CVSS inputs are point-in-time**: exploit probability and severity scores are as current as the last data refresh; they are not re-pulled live from FIRST.org on every simulation run.
- **TEF borrowing** for low-history assets uses the business unit's aggregate distribution, which may understate risk for genuinely novel/unique assets with no comparable peers.
- **Loss magnitude benchmarks** (per-record cost, regulatory penalty) are calibrated against published industry benchmarks (e.g. IBM/Ponemon Cost of a Data Breach) and should be revisited periodically as these benchmarks update.
