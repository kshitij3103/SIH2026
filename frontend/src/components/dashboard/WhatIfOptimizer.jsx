import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  TrendingDown,
  CheckCircle,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { getOptimizedPlan, formatCurrency, formatPercent, formatMultiplier } from '../../api/client';

export const WhatIfOptimizer = ({ orgEal = 0 }) => {
  const [budget, setBudget] = useState(500000);
  const [oneControlPerAsset, setOneControlPerAsset] = useState(true);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runOptimizer = async (targetBudget = budget, targetOnePerAsset = oneControlPerAsset) => {
    if (targetBudget <= 0) {
      setError('Please specify a security budget greater than $0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getOptimizedPlan(targetBudget, targetOnePerAsset);
      setOptimizationResult(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to run ILP investment optimizer'
      );
    } finally {
      setLoading(false);
    }
  };

  // Run initial optimization once on mount
  useEffect(() => {
    runOptimizer(500000, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSliderChange = (e) => {
    setBudget(Number(e.target.value));
  };

  const handleInputChange = (e) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setBudget(val);
    }
  };

  // Quick budget presets
  const presets = [
    { label: '$250k', value: 250000 },
    { label: '$500k', value: 500000 },
    { label: '$750k', value: 750000 },
    { label: '$1.0M', value: 1000000 },
    { label: '$1.5M', value: 1500000 },
  ];

  // Comparison data for Residual EAL Before vs After
  const residualChartData = (() => {
    if (!optimizationResult) return [];
    const totalRiskReduction = optimizationResult.total_risk_reduction_usd || 0;
    const initialEal = optimizationResult.residual_eal_usd
      ? optimizationResult.residual_eal_usd + totalRiskReduction
      : orgEal > 0
        ? orgEal
        : totalRiskReduction * 1.5;
    const residualEal = optimizationResult.residual_eal_usd || Math.max(0, initialEal - totalRiskReduction);

    return [
      { name: 'Initial EAL', eal: initialEal, fill: '#A32B2B' },
      { name: 'Residual EAL', eal: residualEal, fill: '#3D7A52' },
    ];
  })();

  // Comparison data for Optimal ILP vs Naive Greedy
  const greedy = optimizationResult?.greedy_comparison || {};
  const optimalRiskRed = optimizationResult?.total_risk_reduction_usd || 0;
  const greedyRiskRed = greedy.total_risk_reduction_usd || 0;
  const ilpAdvantageUsd = optimalRiskRed - greedyRiskRed;
  const ilpAdvantagePct =
    greedyRiskRed > 0 ? ((ilpAdvantageUsd / greedyRiskRed) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Configuration Panel */}
      <div className="bg-white rounded-md p-6 border border-[#E4E0D6] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4E0D6]">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded bg-[#EEF6F1] text-[#0F5C42]">
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-[#1C1B22] font-serif">
                Security Investment Optimization Workbench
              </h2>
            </div>
            <p className="text-xs text-[#4A4852] mt-0.5">
              Integer Linear Programming (ILP) solver finding the optimal combination of mitigations under capital budget constraints.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#0F5C42] bg-[#EEF6F1] px-2.5 py-1 rounded border border-[#E4E0D6] font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#0F5C42]" />
              Knapsack ILP Engine
            </span>
          </div>
        </div>

        {/* Workflow Breadcrumbs */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-[#4A4852] bg-[#F7F5F0] p-2.5 rounded border border-[#E4E0D6]">
          <span className="font-semibold text-[#1C1B22]">1. Budget Allocation</span>
          <ArrowRight className="w-3 h-3 text-[#7E7C88]" />
          <span>2. Constraints & Dependencies</span>
          <ArrowRight className="w-3 h-3 text-[#7E7C88]" />
          <span>3. Global Optimization Solver</span>
          <ArrowRight className="w-3 h-3 text-[#7E7C88]" />
          <span className="text-[#0F5C42] font-semibold">4. Risk Reduction & ROSI</span>
        </div>

        {/* Interactive Controls Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center pt-1">

          {/* Budget Input & Slider (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1C1B22]">
                Security Budget Allocation (USD)
              </label>
              <div className="flex items-center space-x-1">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setBudget(p.value);
                      runOptimizer(p.value, oneControlPerAsset);
                    }}
                    className={`px-2.5 py-0.5 text-xs font-mono rounded transition-colors border ${
                      budget === p.value
                        ? 'bg-[#0F5C42] text-white border-[#0F5C42] font-semibold'
                        : 'bg-[#F7F5F0] text-[#4A4852] hover:text-[#1C1B22] border-[#E4E0D6]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="10000"
                max="2000000"
                step="10000"
                value={budget}
                onChange={handleSliderChange}
                className="w-full h-2 bg-[#E4E0D6] rounded appearance-none cursor-pointer accent-[#0F5C42]"
              />
              <div className="relative min-w-[140px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#7E7C88]">$</span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={budget}
                  onChange={handleInputChange}
                  className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold bg-[#F7F5F0] border border-[#E4E0D6] rounded text-[#1C1B22] focus:outline-none focus:bg-white focus:border-[#0F5C42] tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Toggle Switch + Run Button (Cols 8-12) */}
          <div className="lg:col-span-5 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3.5">
            {/* Modern Toggle Switch */}
            <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={oneControlPerAsset}
                  onChange={(e) => setOneControlPerAsset(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#E4E0D6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#C8C4B7] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F5C42]"></div>
              </div>
              <span className="text-xs text-[#1C1B22] font-medium">
                Max 1 control / asset
              </span>
            </label>

            {/* Run Button */}
            <button
              onClick={() => runOptimizer(budget, oneControlPerAsset)}
              disabled={loading}
              className="px-4 py-2 rounded bg-[#0F5C42] hover:bg-[#0B4733] text-white font-medium text-xs flex items-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Optimizer</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {error && (
        <div className="p-4 rounded-md bg-[#F9ECEC] border border-[#A32B2B]/30 text-xs text-[#A32B2B] font-medium">
          {error}
        </div>
      )}

      {optimizationResult && (
        <>
          {/* Key Metric Summary Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Allocated Cost */}
            <div className="bg-white rounded-md p-5 border border-[#E4E0D6]">
              <span className="text-xs text-[#7E7C88] font-medium">Optimal Allocated Cost</span>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1B22] mt-1 tabular-nums">
                {formatCurrency(optimizationResult.total_cost_usd)}
              </div>
              <div className="text-xs text-[#7E7C88] mt-1.5 flex items-center justify-between">
                <span>Budget: {formatCurrency(optimizationResult.budget_usd)}</span>
                <span className="text-[#0F5C42] font-mono font-medium">
                  {formatPercent(optimizationResult.budget_utilization_pct)}
                </span>
              </div>
            </div>

            {/* Total Risk Reduction */}
            <div className="bg-[#EEF6F1] rounded-md p-5 border border-[#E4E0D6]">
              <span className="text-xs text-[#0F5C42] font-medium">Total Risk Reduction</span>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-[#0F5C42] mt-1 tabular-nums">
                {formatCurrency(optimizationResult.total_risk_reduction_usd)}
              </div>
              <div className="text-xs text-[#0F5C42] mt-1.5 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Annualized Loss Mitigated</span>
              </div>
            </div>

            {/* Controls Implemented */}
            <div className="bg-white rounded-md p-5 border border-[#E4E0D6]">
              <span className="text-xs text-[#7E7C88] font-medium">Controls Implemented</span>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1B22] mt-1 tabular-nums">
                {optimizationResult.n_actions_selected} Actions
              </div>
              <div className="text-xs text-[#7E7C88] mt-1.5">
                Across target critical assets
              </div>
            </div>

            {/* Residual EAL */}
            <div className="bg-[#FAF3EB] rounded-md p-5 border border-[#E4E0D6]">
              <span className="text-xs text-[#B8752B] font-medium">Residual EAL (Post-Mitigation)</span>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-[#B8752B] mt-1 tabular-nums">
                {formatCurrency(optimizationResult.residual_eal_usd)}
              </div>
              <div className="text-xs text-[#B8752B] mt-1.5">
                Remaining portfolio risk
              </div>
            </div>

          </div>

          {/* Solid Emerald Callout Banner (Actuarial Value Guarantee) */}
          <div className="bg-[#0F5C42] rounded-md p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-[#0B4733] text-[#FAF6ED] text-[11px] font-medium border border-[#3D7A52]">
                <Sparkles className="w-3 h-3 text-[#9A7B2F]" />
                <span>Exact Knapsack ILP Optimization</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold font-serif">
                Exact Knapsack vs Naive Greedy Selection
              </h3>
              <p className="text-xs text-[#EDF5F2] leading-relaxed">
                At your ${formatCurrency(budget)} capital budget, the mathematical solver delivers an additional{' '}
                <strong className="text-white font-semibold underline decoration-[#9A7B2F] decoration-2">
                  {formatCurrency(Math.max(0, ilpAdvantageUsd))}
                </strong>{' '}
                in risk reduction (+{formatPercent(ilpAdvantagePct)}) with zero increase in expenditure.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-[#0B4733] border border-[#3D7A52] rounded p-3 text-center min-w-[130px]">
                <span className="text-[10px] text-[#A6CDBE] uppercase font-semibold block">Greedy Heuristic</span>
                <span className="text-base font-bold font-mono text-white tabular-nums">{formatCurrency(greedyRiskRed)}</span>
              </div>
              <div className="bg-white rounded p-3 text-center min-w-[140px] shadow-xs">
                <span className="text-[10px] text-[#0F5C42] uppercase font-bold block">Knapsack ILP</span>
                <span className="text-base font-bold font-mono text-[#0F5C42] tabular-nums">{formatCurrency(optimalRiskRed)}</span>
              </div>
            </div>
          </div>

          {/* Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Left: Residual EAL Comparison (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-5 border border-[#E4E0D6] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1C1B22] font-serif">
                  Pre vs Post Mitigation Exposure
                </h3>
                <p className="text-[11px] text-[#7E7C88]">
                  Expected Annual Loss before and after optimal control deployments
                </p>
              </div>

              <div className="h-52 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={residualChartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" />
                    <XAxis dataKey="name" stroke="#7E7C88" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#7E7C88"
                      fontSize={11}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Expected Annual Loss']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#E4E0D6',
                        borderRadius: '4px',
                        fontSize: '11px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <Bar dataKey="eal" radius={[3, 3, 0, 0]}>
                      <Cell fill="#A32B2B" />
                      <Cell fill="#3D7A52" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Selected Actions Summary Card (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-5 border border-[#E4E0D6] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1C1B22] font-serif">
                    Portfolio Allocation Strategy
                  </h3>
                  <span className="text-[11px] font-mono text-[#0F5C42] bg-[#EEF6F1] px-2 py-0.5 rounded border border-[#E4E0D6]">
                    {optimizationResult.selected_actions?.length || 0} Controls Selected
                  </span>
                </div>

                <p className="text-xs text-[#4A4852] leading-relaxed">
                  The optimizer evaluated all feasible combinations across the asset inventory and allocated capital to controls providing the maximum system-wide risk reduction factor.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded bg-[#F7F5F0] border border-[#E4E0D6]">
                    <span className="text-[11px] text-[#7E7C88] font-medium">Budget Efficiency</span>
                    <div className="text-base font-bold text-[#1C1B22] font-mono mt-0.5">
                      {formatPercent(optimizationResult.budget_utilization_pct)}
                    </div>
                  </div>
                  <div className="p-3 rounded bg-[#EEF6F1] border border-[#E4E0D6]">
                    <span className="text-[11px] text-[#0F5C42] font-medium">Risk Mitigated</span>
                    <div className="text-base font-bold text-[#0F5C42] font-mono mt-0.5">
                      {formatCurrency(optimizationResult.total_risk_reduction_usd)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded bg-[#FAF6ED] border border-[#E4E0D6] text-xs text-[#9A7B2F] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9A7B2F] shrink-0" />
                <span>Review prioritized mitigation deployments in the table below.</span>
              </div>
            </div>

          </div>

          {/* Selected Actions Table */}
          <div className="bg-white rounded-md border border-[#E4E0D6] overflow-hidden">
            <div className="p-4 border-b border-[#E4E0D6] bg-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded bg-[#EEF6F1] text-[#0F5C42]">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1C1B22] font-serif">
                    Recommended Implementation Plan
                  </h3>
                  <p className="text-[11px] text-[#7E7C88]">
                    Optimal asset-to-control assignments generated by the optimizer
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#0F5C42] bg-[#EEF6F1] px-2 py-0.5 rounded border border-[#E4E0D6]">
                {optimizationResult.selected_actions?.length || 0} Actions Selected
              </span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#F7F5F0] border-b border-[#E4E0D6] text-[11px] font-semibold text-[#4A4852]">
                  <tr>
                    <th className="py-2.5 px-4">Asset ID</th>
                    <th className="py-2.5 px-4">Control Name</th>
                    <th className="py-2.5 px-4 text-right">Implementation Cost</th>
                    <th className="py-2.5 px-4 text-right">Risk Reduction</th>
                    <th className="py-2.5 px-4 text-right">ROSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6] font-mono">
                  {optimizationResult.selected_actions &&
                    optimizationResult.selected_actions.length > 0 ? (
                    optimizationResult.selected_actions.map((action, idx) => {
                      const cost = action.cost_usd || action.cost || 0;
                      const red = action.Risk_Reduction_usd || action.risk_reduction_usd || 0;
                      const rosi = action.ROSI || (cost > 0 ? red / cost : 0);

                      return (
                        <tr key={idx} className="hover:bg-[#F7F5F0] transition-colors">
                          <td className="py-2.5 px-4 text-[#1C1B22] font-bold">
                            {action.asset_id}
                          </td>
                          <td className="py-2.5 px-4 text-[#4A4852] font-sans font-medium">
                            {action.control_name || action.control_id}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#1C1B22] tabular-nums">
                            {formatCurrency(cost)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#0F5C42] font-bold tabular-nums">
                            {formatCurrency(red)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#0F5C42] font-bold tabular-nums">
                            {formatMultiplier(rosi)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#7E7C88] font-sans">
                        No actions selected for this budget level. Increase budget to see allocations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

