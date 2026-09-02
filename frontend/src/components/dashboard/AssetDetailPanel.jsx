import React, { useEffect, useState } from 'react';
import {
  X,
  Server,
  TrendingUp,
  AlertTriangle,
  Database,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getAssetDetail, formatCurrency } from '../../api/client';

export const AssetDetailPanel = ({ assetId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assetId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getAssetDetail(assetId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || err.message || 'Failed to fetch asset detail');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [assetId]);

  if (!assetId) return null;

  const exceedancePoints = (() => {
    if (!data) return [];
    if (data.loss_exceedance_curve && Array.isArray(data.loss_exceedance_curve)) {
      return data.loss_exceedance_curve;
    }
    const eal = data.EAL_usd || 0;
    const var95 = data.VaR95_usd || eal * 2.5;
    const var99 = data.VaR99_usd || var95 * 1.5;

    return [
      { probability: '50%', loss: Math.round(eal * 0.7), probNum: 50 },
      { probability: '20%', loss: Math.round(eal * 1.2), probNum: 20 },
      { probability: '10%', loss: Math.round(eal * 1.8), probNum: 10 },
      { probability: '5% (VaR 95)', loss: Math.round(var95), probNum: 5 },
      { probability: '1% (VaR 99)', loss: Math.round(var99), probNum: 1 },
      { probability: '0.1%', loss: Math.round(var99 * 1.4), probNum: 0.1 },
    ];
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#1C1B22]/40 backdrop-blur-[2px] flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-white border-l border-[#E4E0D6] shadow-2xl h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-[#E4E0D6] bg-[#F7F5F0] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded bg-[#EEF6F1] text-[#0F5C42]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-[#1C1B22] font-mono">
                  {assetId}
                </h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EEF6F1] text-[#0F5C42] border border-[#E4E0D6]">
                  {data?.business_unit || 'Asset'}
                </span>
              </div>
              <p className="text-[11px] text-[#7E7C88]">Open FAIR™ Risk Quantification Breakdown</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#7E7C88] hover:text-[#1C1B22] hover:bg-[#EAE6DB] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-16 bg-[#F7F5F0] rounded"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-[#F7F5F0] rounded"></div>
                <div className="h-16 bg-[#F7F5F0] rounded"></div>
              </div>
              <div className="h-44 bg-[#F7F5F0] rounded"></div>
            </div>
          ) : error ? (
            <div className="p-5 rounded bg-[#F9ECEC] border border-[#A32B2B]/30 text-center">
              <AlertTriangle className="w-5 h-5 text-[#A32B2B] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#A32B2B] font-serif">Error Loading Asset Data</p>
              <p className="text-xs text-[#A32B2B]/90 mt-1">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded bg-white border border-[#E4E0D6]">
                  <span className="text-xs text-[#7E7C88] font-medium">Expected Loss (EAL)</span>
                  <div className="text-xl font-bold font-serif text-[#1C1B22] mt-0.5 tabular-nums">
                    {formatCurrency(data.EAL_usd)}
                  </div>
                  <span className="text-[11px] text-[#0F5C42]">Annualized Mean</span>
                </div>

                <div className="p-3.5 rounded bg-white border border-[#E4E0D6]">
                  <span className="text-xs text-[#7E7C88] font-medium">Value at Risk 95%</span>
                  <div className="text-xl font-bold font-serif text-[#B8752B] mt-0.5 tabular-nums">
                    {formatCurrency(data.VaR95_usd)}
                  </div>
                  <span className="text-[11px] text-[#B8752B]">1-in-20 Year Tail</span>
                </div>

                <div className="p-3.5 rounded bg-white border border-[#E4E0D6] col-span-2 sm:col-span-1">
                  <span className="text-xs text-[#7E7C88] font-medium">Value at Risk 99%</span>
                  <div className="text-xl font-bold font-serif text-[#A32B2B] mt-0.5 tabular-nums">
                    {formatCurrency(data.VaR99_usd)}
                  </div>
                  <span className="text-[11px] text-[#A32B2B]">1-in-100 Year Catastrophe</span>
                </div>
              </div>

              {/* Asset Attribute Details */}
              <div className="p-4 rounded bg-[#F7F5F0] border border-[#E4E0D6] space-y-2.5">
                <h4 className="text-xs font-semibold text-[#1C1B22] font-serif flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#0F5C42]" />
                  Asset Metadata & Risk Parameters
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-[#7E7C88]">Business Unit:</div>
                  <div className="text-[#1C1B22] font-medium">{data.business_unit || 'N/A'}</div>

                  <div className="text-[#7E7C88]">Criticality Rating:</div>
                  <div className="text-[#1C1B22] font-medium">{data.criticality || 'N/A'}</div>

                  <div className="text-[#7E7C88]">Risk Priority Score:</div>
                  <div className="text-[#0F5C42] font-mono font-bold">
                    {data.priority_score !== undefined ? Number(data.priority_score).toFixed(1) : 'N/A'}
                  </div>

                  {data.asset_type && (
                    <>
                      <div className="text-[#7E7C88]">Asset Type:</div>
                      <div className="text-[#1C1B22]">{data.asset_type}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Loss Exceedance Curve (LEC) Chart */}
              <div className="p-4 rounded bg-white border border-[#E4E0D6] space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-[#1C1B22] font-serif flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0F5C42]" />
                    Loss Exceedance Curve (LEC)
                  </h4>
                  <p className="text-[11px] text-[#7E7C88]">
                    Probability that annual loss exceeds threshold value
                  </p>
                </div>

                <div className="h-52 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={exceedancePoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLossEmerald" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F5C42" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0F5C42" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" />
                      <XAxis dataKey="probability" stroke="#7E7C88" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#7E7C88"
                        fontSize={10}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Loss Threshold']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#E4E0D6',
                          borderRadius: '4px',
                          fontSize: '11px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="loss"
                        stroke="#0F5C42"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLossEmerald)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4E0D6] bg-[#F7F5F0] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded bg-white border border-[#E4E0D6] hover:bg-[#EAE6DB] text-[#1C1B22] transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};


