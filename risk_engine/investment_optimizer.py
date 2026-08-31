from __future__ import annotations

import pandas as pd
import pulp


def optimize_investments(
    scenarios: pd.DataFrame,
    budget_usd: float,
    one_control_per_asset: bool = False,
) -> dict:
    """
    Select the subset of candidate (asset, control) actions that maximizes
    total Risk_Reduction_usd subject to a total cost cap.

    Parameters
    ----------
    scenarios : DataFrame
        Must have columns: control_id, control_name (or name), asset_id,
        cost_usd, EAL_before, EAL_after, Risk_Reduction_usd, ROSI.
        One row per candidate action (i.e. control_scenario_results.parquet).
    budget_usd : float
        Total available budget.
    one_control_per_asset : bool
        If True, at most one control can be purchased per asset (useful if
        you want to model "pick the single best defense per asset" instead
        of allowing multiple controls stacked on the same asset). Default
        False, since your engine's additive_capped resistance model is
        designed to support multiple controls per asset.

    Returns
    -------
    dict with:
        selected            -> DataFrame of chosen actions
        total_cost_usd
        total_risk_reduction_usd
        budget_utilization_pct
        residual_eal_usd    -> sum(EAL_after) for selected + EAL_before for
                               everything not selected (rough org-level residual)
        greedy_comparison   -> same metrics for a naive "sort by ROSI" baseline
    """
    df = scenarios.copy().reset_index(drop=True)
    n = len(df)

    prob = pulp.LpProblem("investment_optimization", pulp.LpMaximize)
    x = [pulp.LpVariable(f"x_{i}", cat="Binary") for i in range(n)]

    # Objective: maximize total risk reduction
    prob += pulp.lpSum(df.loc[i, "Risk_Reduction_usd"] * x[i] for i in range(n))

    # Budget constraint
    prob += pulp.lpSum(df.loc[i, "cost_usd"] * x[i] for i in range(n)) <= budget_usd

    # Optional: at most one control per asset
    if one_control_per_asset:
        for asset_id, group in df.groupby("asset_id"):
            prob += pulp.lpSum(x[i] for i in group.index) <= 1

    prob.solve(pulp.PULP_CBC_CMD(msg=False))

    df["selected"] = [bool(round(x[i].value())) for i in range(n)]
    selected = df[df["selected"]].drop(columns=["selected"])

    total_cost = selected["cost_usd"].sum()
    total_reduction = selected["Risk_Reduction_usd"].sum()

    result = {
        "selected": selected,
        "total_cost_usd": total_cost,
        "total_risk_reduction_usd": total_reduction,
        "budget_utilization_pct": round(100 * total_cost / budget_usd, 2) if budget_usd else 0,
        "n_actions_selected": len(selected),
        "greedy_comparison": _greedy_baseline(df, budget_usd),
    }
    return result


def _greedy_baseline(df: pd.DataFrame, budget_usd: float) -> dict:

    ranked = df.sort_values("ROSI", ascending=False)
    spent, gained, chosen_idx = 0.0, 0.0, []
    for i, row in ranked.iterrows():
        if spent + row["cost_usd"] <= budget_usd:
            spent += row["cost_usd"]
            gained += row["Risk_Reduction_usd"]
            chosen_idx.append(i)
    return {
        "total_cost_usd": spent,
        "total_risk_reduction_usd": gained,
        "n_actions_selected": len(chosen_idx),
    }


def run_from_parquet(
    scenario_path: str = "outputs/control_scenario_results.parquet",
    budget_usd: float = 5_000_000,
    one_control_per_asset: bool = False,
) -> dict:
    """Convenience wrapper matching the rest of the pipeline's outputs/ convention."""
    scenarios = pd.read_parquet(scenario_path)
    return optimize_investments(scenarios, budget_usd, one_control_per_asset)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Phase 4: budget-constrained investment optimizer")
    parser.add_argument("--budget", type=float, required=True, help="Budget in USD")
    parser.add_argument(
        "--scenarios",
        default="outputs/control_scenario_results.parquet",
        help="Path to control_scenario_results.parquet",
    )
    parser.add_argument(
        "--one-control-per-asset",
        action="store_true",
        help="Restrict to at most one control purchased per asset",
    )
    args = parser.parse_args()

    result = run_from_parquet(args.scenarios, args.budget, args.one_control_per_asset)
    print(f"\nBudget: ${args.budget:,.0f}")
    print(f"Selected {result['n_actions_selected']} actions")
    print(f"Total cost: ${result['total_cost_usd']:,.0f} ({result['budget_utilization_pct']}% of budget)")
    print(f"Total risk reduction: ${result['total_risk_reduction_usd']:,.0f}")
    print(f"\nGreedy (sort-by-ROSI) baseline for comparison:")
    print(f"  Total risk reduction: ${result['greedy_comparison']['total_risk_reduction_usd']:,.0f}")
    print(f"\nSelected actions:\n{result['selected'][['asset_id', 'control_id', 'cost_usd', 'Risk_Reduction_usd', 'ROSI']]}")