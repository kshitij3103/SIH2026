import React from 'react';
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
import { Building2, Layers } from 'lucide-react';
import { formatCurrency } from '../../api/client';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-md border border-[#E4E0D6] shadow-sm text-xs space-y-1.5 min-w-[210px]">
        <div className="font-semibold text-[#1C1B22] border-b border-[#E4E0D6] pb-1 flex items-center justify-between font-serif">
          <span>{data.business_unit}</span>
          <span className="text-[10px] text-[#0F5C42] font-mono font-medium">BU Exposure</span>
        </div>
        <div className="flex justify-between items-center text-[#4A4852] pt-0.5">
          <span>Total EAL:</span>
          <span className="font-mono font-bold text-[#1C1B22] tabular-nums">{formatCurrency(data.total_EAL_usd)}</span>
        </div>
        <div className="flex justify-between items-center text-[#4A4852]">
          <span>VaR 95% Bound:</span>
          <span className="font-mono font-semibold text-[#B8752B] tabular-nums">
            {formatCurrency(data.total_VaR95_usd_upper_bound || data.total_VaR95_usd)}
          </span>
        </div>
        {data.top_contributors && (
          <div className="pt-1 text-[11px] text-[#7E7C88] border-t border-[#E4E0D6]">
            <span className="font-medium">Top Contributors: </span>
            <span className="text-[#4A4852] font-mono">
              {Array.isArray(data.top_contributors)
                ? data.top_contributors.join(', ')
                : String(data.top_contributors)}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const BusinessUnitChart = ({ data = [], loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-md p-6 border border-[#E4E0D6] h-[360px] flex flex-col justify-center items-center">
        <div className="w-7 h-7 rounded-full border-2 border-[#0F5C42] border-t-transparent animate-spin mb-3"></div>
        <p className="text-xs text-[#7E7C88] font-medium">Aggregating Business Unit Risk Exposures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-md p-6 border border-[#A32B2B]/30 text-center h-[360px] flex flex-col justify-center items-center">
        <p className="text-xs font-semibold text-[#A32B2B] mb-1 font-serif">Error loading Business Unit Risk</p>
        <p className="text-xs text-[#A32B2B]/90 mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-xs font-medium rounded bg-[#A32B2B] text-white hover:bg-[#852222]"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-md p-6 border border-[#E4E0D6] text-center h-[360px] flex flex-col justify-center items-center">
        <Layers className="w-7 h-7 text-[#7E7C88] mb-2" />
        <p className="text-xs font-semibold text-[#1C1B22] font-serif">No Business Unit Data</p>
        <p className="text-xs text-[#7E7C88]">Run the risk pipeline to populate metrics.</p>
      </div>
    );
  }

  // Sort descending by total_EAL_usd (highest risk first)
  const sortedData = [...data].sort((a, b) => (b.total_EAL_usd || 0) - (a.total_EAL_usd || 0));

  return (
    <div className="bg-white rounded-md p-5 border border-[#E4E0D6] flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-[#EEF6F1] text-[#0F5C42]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1C1B22] font-serif">
              Risk Exposure by Business Unit
            </h3>
            <p className="text-[11px] text-[#7E7C88]">
              Annualized loss magnitude across business operational divisions
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#0F5C42] bg-[#EEF6F1] px-2 py-0.5 rounded border border-[#E4E0D6]">
          {sortedData.length} Units
        </span>
      </div>

      <div className="w-full h-[270px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              stroke="#7E7C88"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="business_unit"
              stroke="#2F2E36"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 246, 241, 0.5)' }} />
            <Bar dataKey="total_EAL_usd" radius={[0, 3, 3, 0]}>
              {sortedData.map((entry, index) => {
                const fillColor =
                  index === 0
                    ? '#A32B2B' // Critical Tier 1
                    : index === 1
                    ? '#B8752B' // Moderate Tier 2
                    : '#0F5C42'; // Low/Baseline
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


