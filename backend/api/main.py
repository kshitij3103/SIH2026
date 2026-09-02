import logging
import os
from pathlib import Path

import numpy as np
import pandas as pd
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except Exception:
    pass

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from risk_engine.investment_optimizer import optimize_investments
from api.chat import router as chat_router

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="Cyber Risk Quantification API",
    description="API for accessing computed financial cyber risk metrics.",
    version="1.0.0",
)

app.include_router(chat_router)

# --- CORS: required so the frontend dashboard (running on a different
# port, e.g. localhost:3000 or localhost:5173) can call this API.
# For the hackathon demo, allow_origins=["*"] is simplest. If you want to
# be stricter, replace "*" with your actual frontend dev server URL(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Output directory relative to this file
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs"


def load_parquet(filename: str) -> pd.DataFrame:
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(
            f"Output file not found: {file_path}. Have you run `python -m risk_engine.pipeline`?"
        )
    return pd.read_parquet(file_path)


def _handle_load_error(e: Exception):
    """Distinguish 'pipeline not run yet' from real server errors."""
    if isinstance(e, FileNotFoundError):
        raise HTTPException(status_code=503, detail=str(e))
    logger.exception("Unexpected error while serving request")
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health_check():
    """Returns the API status."""
    return {"status": "ok"}


@app.get("/risk/assets")
def get_asset_risk_summary():
    """Returns risk metrics for all assets."""
    try:
        df = load_parquet("asset_risk_summary.parquet")
        summary_df = df[
            ["asset_id", "business_unit", "criticality", "EAL_usd", "VaR95_usd", "VaR99_usd", "priority_score"]
        ]
        return summary_df.to_dict(orient="records")
    except Exception as e:
        _handle_load_error(e)


@app.get("/risk/assets/{asset_id}")
def get_asset_risk_detail(asset_id: str):
    """Returns detailed risk metrics for a single asset, including the Loss Exceedance Curve (if present)."""
    try:
        df = load_parquet("asset_risk_summary.parquet")
        asset_data = df[df["asset_id"] == asset_id]
        if asset_data.empty:
            raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")

        record = asset_data.iloc[0].to_dict()

        # Defensively convert any numpy/array-like fields to plain lists so
        # they serialize cleanly to JSON for the frontend.
        for key, value in record.items():
            if isinstance(value, np.ndarray):
                record[key] = value.tolist()
            elif isinstance(value, (np.integer,)):
                record[key] = int(value)
            elif isinstance(value, (np.floating,)):
                record[key] = float(value)

        return record
    except HTTPException:
        raise
    except Exception as e:
        _handle_load_error(e)


@app.get("/risk/business-units")
def get_business_unit_risk():
    """Returns aggregated risk metrics per Business Unit."""
    try:
        df = load_parquet("business_unit_risk_summary.parquet")
        return df.to_dict(orient="records")
    except Exception as e:
        _handle_load_error(e)


@app.get("/risk/organization")
def get_organization_risk():
    """Returns top-level enterprise risk metrics."""
    try:
        df = load_parquet("org_risk_summary.parquet")
        return df.to_dict(orient="records")
    except Exception as e:
        _handle_load_error(e)


@app.get("/controls/scenarios")
def get_all_scenarios():
    """Returns all control what-if scenarios."""
    try:
        df = load_parquet("control_scenario_results.parquet")
        return df.to_dict(orient="records")
    except Exception as e:
        _handle_load_error(e)


@app.get("/controls/roi")
def get_controls_roi():
    """Returns controls ranked by overall Return on Security Investment (ROSI)."""
    try:
        df = load_parquet("control_scenario_results.parquet")
        grouped = df.groupby(["control_id", "control_name"]).agg(
            total_cost_usd=("cost_usd", "sum"),
            total_risk_reduction_usd=("Risk_Reduction_usd", "sum"),
            applicable_assets=("asset_id", "count"),
        ).reset_index()

        grouped["overall_ROSI"] = grouped["total_risk_reduction_usd"] / grouped["total_cost_usd"]
        grouped = grouped.sort_values(by="overall_ROSI", ascending=False)
        return grouped.to_dict(orient="records")
    except Exception as e:
        _handle_load_error(e)


@app.get("/controls/optimize")
def get_optimal_investment_plan(
    budget: float = Query(..., gt=0, description="Available security budget in USD"),
    one_control_per_asset: bool = Query(
        True, description="Restrict to at most one control per asset (recommended default)"
    ),
):
    """
    Runs the budget-constrained investment optimizer and returns the
    recommended set of (asset, control) actions for the given budget,
    along with a comparison against a naive greedy-by-ROSI baseline.

    This is the endpoint the dashboard's "what-if budget" slider should call.
    """
    try:
        scenarios = load_parquet("control_scenario_results.parquet")
        result = optimize_investments(scenarios, budget_usd=budget, one_control_per_asset=one_control_per_asset)

        return {
            "budget_usd": budget,
            "total_cost_usd": result["total_cost_usd"],
            "total_risk_reduction_usd": result["total_risk_reduction_usd"],
            "budget_utilization_pct": result["budget_utilization_pct"],
            "n_actions_selected": result["n_actions_selected"],
            "residual_eal_usd": result["residual_eal_usd"],
            "greedy_comparison": result["greedy_comparison"],
            "selected_actions": result["selected"].to_dict(orient="records"),
        }
    except Exception as e:
        _handle_load_error(e)