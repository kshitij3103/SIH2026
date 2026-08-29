import json
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
import pandas as pd
import numpy as np

app = FastAPI(
    title="Cyber Risk Quantification API",
    description="API for accessing computed financial cyber risk metrics.",
    version="1.0.0"
)

# Output directory relative to this file
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs"

def load_parquet(filename: str) -> pd.DataFrame:
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Output file not found: {file_path}. Have you run the pipeline?")
    return pd.read_parquet(file_path)

# @app.get("/")
# def root():
#     return {"message": "Cyber Risk Quantification API is running. Visit /docs for API documentation."}


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
        # Ensure we drop full LEC_points to save bandwidth, or provide a limited summary
        summary_df = df[["asset_id", "business_unit", "criticality", "EAL_usd", "VaR95_usd", "VaR99_usd", "priority_score"]]
        return summary_df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/risk/assets/{asset_id}")
def get_asset_risk_detail(asset_id: str):
    """Returns detailed risk metrics for a single asset, including the Loss Exceedance Curve."""
    try:
        df = load_parquet("asset_risk_summary.parquet")
        asset_data = df[df["asset_id"] == asset_id]
        if asset_data.empty:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        record = asset_data.iloc[0].to_dict()
        
        # Format numpy arrays back to lists if needed
        if isinstance(record.get("LEC_points"), np.ndarray):
            record["LEC_points"] = record["LEC_points"].tolist()
            
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/risk/business-units")
def get_business_unit_risk():
    """Returns aggregated risk metrics per Business Unit."""
    try:
        df = load_parquet("business_unit_risk_summary.parquet")
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/risk/organization")
def get_organization_risk():
    """Returns top-level enterprise risk metrics."""
    try:
        df = load_parquet("org_risk_summary.parquet")
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/controls/scenarios")
def get_all_scenarios():
    """Returns all control what-if scenarios."""
    try:
        df = load_parquet("control_scenario_results.parquet")
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/controls/roi")
def get_controls_roi():
    """Returns controls ranked by overall Return on Security Investment (ROSI)."""
    try:
        df = load_parquet("control_scenario_results.parquet")
        # Aggregate ROSI per control across all applicable assets
        grouped = df.groupby(["control_id", "control_name"]).agg(
            total_cost_usd=("cost_usd", "sum"),
            total_risk_reduction_usd=("Risk_Reduction_usd", "sum"),
            applicable_assets=("asset_id", "count")
        ).reset_index()
        
        grouped["overall_ROSI"] = grouped["total_risk_reduction_usd"] / grouped["total_cost_usd"]
        grouped = grouped.sort_values(by="overall_ROSI", ascending=False)
        return grouped.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
