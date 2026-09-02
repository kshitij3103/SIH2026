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
import { Award, Zap } from 'lucide-react';
import { formatCurrency, formatMultiplier } from '../../api/client';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-md border border-[#E4E0D6] shadow-sm text-xs space-y-1.5 min-w-[240px]">
        <div className="font-semibold text-[#1C1B22] border-b border-[#E4E0D6] pb-1 flex items-center justify-between font-serif">
          <span className="truncate max-w-[170px]">{d.control_name || d.control_id}</span>
          <span className="text-[10px] text-[#0F5C42] font-mono font-bold">
            {formatMultiplier(d.overall_ROSI)} ROSI
          </span>
        </div>
        <div className="flex justify-between items-center text-[#4A4852]">
          <span>Investment Cost:</span>
          <span className="font-mono text-[#1C1B22] font-medium tabular-nums">{formatCurrency(d.total_cost_usd)}</span>
        </div>
        <div className="flex justify-between items-center text-[#4A4852]">
          <span>Risk Reduction:</span>
          <span className="font-mono text-[#0F5C42] font-semibold tabular-nums">
            {formatCurrency(d.total_risk_reduction_usd)}
          </span>
        </div>
        <div className="flex justify-between items-center text-[#4A4852] pt-1 border-t border-[#E4E0D6]">
          <span>Applicable Assets:</span>
          <span className="font-mono text-[#7E7C88]">{d.applicable_assets || '—'}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ControlsROIChart = ({ data = [], loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-md p-6 border border-[#E4E0D6] h-[360px] flex flex-col justify-center items-center">
        <div className="w-7 h-7 rounded-full border-2 border-[#0F5C42] border-t-transparent animate-spin mb-3"></div>
        <p className="text-xs text-[#7E7C88] font-medium">Calculating Return on Security Investment (ROSI)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-md p-6 border border-[#A32B2B]/30 text-center h-[360px] flex flex-col justify-center items-center">
        <p className="text-xs font-semibold text-[#A32B2B] mb-1 font-serif">Error Loading Controls ROI</p>
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
        <Award className="w-7 h-7 text-[#7E7C88] mb-2" />
        <p className="text-xs font-semibold text-[#1C1B22] font-serif">No Controls ROI Data</p>
        <p className="text-xs text-[#7E7C88]">Run risk scenarios to evaluate control mitigations.</p>
      </div>
    );
  }

  // Sort descending by overall_ROSI
  const sortedData = [...data].sort((a, b) => (b.overall_ROSI || 0) - (a.overall_ROSI || 0));

  return (
    <div className="bg-white rounded-md p-5 border border-[#E4E0D6] flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-[#EEF6F1] text-[#0F5C42]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1C1B22] font-serif">
              Security Controls Ranked by ROI (ROSI)
            </h3>
            <p className="text-[11px] text-[#7E7C88]">
              ROSI = (Risk Reduction USD) / (Implementation Cost USD)
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#0F5C42] bg-[#EEF6F1] px-2 py-0.5 rounded border border-[#E4E0D6]">
          Ranked by ROI
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
              tickFormatter={(val) => `${val.toFixed(1)}x`}
              stroke="#7E7C88"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="control_name"
              stroke="#2F2E36"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={135}
              tickFormatter={(val) => (val && val.length > 18 ? `${val.substring(0, 18)}...` : val)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 246, 241, 0.5)' }} />
            <Bar dataKey="overall_ROSI" radius={[0, 3, 3, 0]}>
              {sortedData.map((entry, index) => {
                const fillColor =
                  index === 0
                    ? '#0F5C42' // Deep Emerald
                    : index <= 2
                    ? '#3D7A52' // Muted Sage
                    : '#9E9B90'; // Warm Slate
                return <Cell key={`cell-ctrl-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};



