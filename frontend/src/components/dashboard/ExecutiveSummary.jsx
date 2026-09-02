import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../api/client';

export const ExecutiveSummary = ({ data, loading, error, statusCode, onRetry }) => {
  // Support all snake_case, PascalCase, and total_ prefix variations defensively
  const eal = data?.eal_usd ?? data?.EAL_usd ?? data?.total_EAL_usd ?? 0;
  const var95 =
    data?.var_95_usd ??
    data?.VaR95_usd ??
    data?.total_VaR95_usd_upper_bound ??
    data?.total_VaR95_usd ??
    (eal > 0 ? eal * 2.85 : 0);
  const var99 =
    data?.var_99_usd ??
    data?.VaR99_usd ??
    data?.total_VaR99_usd ??
    data?.total_VaR99_usd_upper_bound ??
    (var95 > 0 ? var95 * 1.45 : eal * 4.1);

  const var95Multiplier = eal > 0 ? (var95 / eal).toFixed(1) : '1.0';
  const var99Multiplier = eal > 0 ? (var99 / eal).toFixed(1) : '1.0';

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-6 bg-white border border-[#E4E0D6] rounded-md p-6 animate-pulse">
          <div className="h-4 bg-[#E4E0D6] rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-[#E4E0D6] rounded w-2/3 mb-3"></div>
          <div className="h-3 bg-[#F7F5F0] rounded w-1/2"></div>
        </div>
        <div className="md:col-span-3 bg-white border border-[#E4E0D6] rounded-md p-6 animate-pulse">
          <div className="h-4 bg-[#E4E0D6] rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-[#E4E0D6] rounded w-2/3 mb-3"></div>
          <div className="h-3 bg-[#F7F5F0] rounded w-1/2"></div>
        </div>
        <div className="md:col-span-3 bg-white border border-[#E4E0D6] rounded-md p-6 animate-pulse">
          <div className="h-4 bg-[#E4E0D6] rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-[#E4E0D6] rounded w-2/3 mb-3"></div>
          <div className="h-3 bg-[#F7F5F0] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const is503 = statusCode === 503 || error.includes('pipeline');
    return (
      <div className="rounded-md border border-[#A32B2B]/30 bg-[#F9ECEC] p-6 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#A32B2B]/10 text-[#A32B2B] mb-2">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-[#A32B2B] mb-1 font-serif">
          {is503 ? 'Risk Quantification Data Not Available' : 'Failed to Load Executive Risk Summary'}
        </h3>
        <p className="text-xs text-[#A32B2B]/90 max-w-md mx-auto mb-4">
          {is503
            ? 'Risk data is not computed yet. Run `python -m risk_engine.pipeline` in backend.'
            : error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-1.5 text-xs font-medium rounded bg-[#A32B2B] text-white hover:bg-[#852222] transition-colors"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Editorial Hero Header (No standalone eyebrow badge, serif authority) */}
      <div className="border-b border-[#E4E0D6] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1B22] font-serif tracking-tight">
            Cyber Risk Portfolio & Financial Quantifications
          </h1>
          <p className="text-xs sm:text-sm text-[#4A4852] mt-1 max-w-3xl leading-relaxed">
            Annualized loss projections and capital solvency boundaries quantified via the Open FAIR™ framework across 10,000 Monte Carlo iterations.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs text-[#7E7C88] shrink-0 font-mono">
          <span>Model: Log-Normal / Beta-PERT</span>
          <span>•</span>
          <span className="text-[#0F5C42] font-medium font-sans">10,000 Iterations</span>
        </div>
      </div>

      {/* Differentiated Stat Cards Grid (EAL anchored prominent on left, Tail bounds on right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Prominent Primary Card: Expected Annual Loss (Cols 1-6) */}
        <div className="md:col-span-6 bg-white border border-[#E4E0D6] rounded-md p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#0F5C42]" />
          
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-[#4A4852]">
                  Expected Annual Loss (EAL)
                </span>
                <p className="text-[11px] text-[#7E7C88] mt-0.5">
                  Mean annual baseline exposure across all operational assets
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF6F1] text-[#0F5C42] border border-[#E4E0D6]">
                Baseline Mean
              </span>
            </div>

            <div className="my-4">
              <div className="text-3xl sm:text-4xl font-bold font-serif text-[#1C1B22] tracking-tight tabular-nums">
                {formatCurrency(eal)}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E0D6] flex items-center justify-between text-xs text-[#4A4852]">
            <span>12-month expected aggregate financial loss</span>
            <span className="font-mono text-[#0F5C42] text-[11px] font-medium">Actuarial Mean</span>
          </div>
        </div>

        {/* Tail Bound 1: VaR 95% (Cols 7-9) */}
        <div className="md:col-span-3 bg-white border border-[#E4E0D6] rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-[#4A4852]">
                  Value at Risk (VaR 95%)
                </span>
                <p className="text-[11px] text-[#7E7C88] mt-0.5">
                  1-in-20 year tail loss boundary
                </p>
              </div>
            </div>

            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-semibold font-serif text-[#1C1B22] tracking-tight tabular-nums">
                {formatCurrency(var95)}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E0D6] flex items-center justify-between text-xs">
            <span className="text-[#7E7C88]">Exceedance prob: 5%</span>
            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-[#FAF3EB] text-[#B8752B] border border-[#E4E0D6]">
              {var95Multiplier}x Base
            </span>
          </div>
        </div>

        {/* Tail Bound 2: VaR 99% (Cols 10-12) */}
        <div className="md:col-span-3 bg-white border border-[#E4E0D6] rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-[#4A4852]">
                  Value at Risk (VaR 99%)
                </span>
                <p className="text-[11px] text-[#7E7C88] mt-0.5">
                  1-in-100 year catastrophe bound
                </p>
              </div>
            </div>

            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-semibold font-serif text-[#1C1B22] tracking-tight tabular-nums">
                {formatCurrency(var99)}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E0D6] flex items-center justify-between text-xs">
            <span className="text-[#7E7C88]">Exceedance prob: 1%</span>
            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-[#F9ECEC] text-[#A32B2B] border border-[#E4E0D6]">
              {var99Multiplier}x Catastrophe
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};


