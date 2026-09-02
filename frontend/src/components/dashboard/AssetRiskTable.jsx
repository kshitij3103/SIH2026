import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Server,
  AlertCircle,
  ChevronRight,
  Filter,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '../../api/client';

export const AssetRiskTable = ({
  assets = [],
  loading,
  error,
  onSelectAsset,
  selectedAssetId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('EAL_usd');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedBU, setSelectedBU] = useState('ALL');
  const [showZeroRisk, setShowZeroRisk] = useState(false);

  // Identify top 5 EAL assets across entire portfolio
  const top5AssetIds = useMemo(() => {
    if (!assets || assets.length === 0) return new Set();
    const sorted = [...assets].sort((a, b) => (b.EAL_usd || 0) - (a.EAL_usd || 0));
    return new Set(sorted.slice(0, 5).map((a) => a.asset_id));
  }, [assets]);

  // Unique Business Units for quick filter pill
  const businessUnits = useMemo(() => {
    if (!assets) return [];
    const bus = new Set(assets.map((a) => a.business_unit).filter(Boolean));
    return ['ALL', ...Array.from(bus)];
  }, [assets]);

  // Total count of 0 EAL assets across the dataset
  const zeroRiskAssetsCount = useMemo(() => {
    if (!assets) return 0;
    return assets.filter((a) => (a.EAL_usd || 0) === 0).length;
  }, [assets]);

  // Filtered & Sorted list
  const processedAssets = useMemo(() => {
    let list = [...(assets || [])];

    // Filter by search
    const hasSearch = Boolean(searchTerm.trim());
    if (hasSearch) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.asset_id?.toLowerCase().includes(q) ||
          a.business_unit?.toLowerCase().includes(q) ||
          a.criticality?.toLowerCase().includes(q)
      );
    }

    // Filter by BU
    if (selectedBU !== 'ALL') {
      list = list.filter((a) => a.business_unit === selectedBU);
    }

    // Hide 0 EAL assets by default unless toggled ON or user is searching
    if (!showZeroRisk && !hasSearch) {
      list = list.filter((a) => (a.EAL_usd || 0) > 0);
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [assets, searchTerm, selectedBU, showZeroRisk, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#7E7C88] opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0F5C42]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0F5C42]" />
    );
  };

  const getCriticalityBadge = (crit) => {
    const c = String(crit || '').toUpperCase();
    if (c === 'HIGH' || c === 'CRITICAL' || c === 'TIER 1') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F9ECEC] text-[#A32B2B] border border-[#E4E0D6]">
          {crit}
        </span>
      );
    }
    if (c === 'MEDIUM' || c === 'TIER 2') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF3EB] text-[#B8752B] border border-[#E4E0D6]">
          {crit}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF6F1] text-[#3D7A52] border border-[#E4E0D6]">
        {crit || 'Low'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-md p-6 border border-[#E4E0D6] animate-pulse">
        <div className="h-5 bg-[#E4E0D6] rounded w-1/4 mb-4"></div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-[#F7F5F0] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-md p-6 border border-[#A32B2B]/30 text-center">
        <AlertCircle className="w-6 h-6 text-[#A32B2B] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#A32B2B] font-serif">Failed to load asset inventory</p>
        <p className="text-xs text-[#A32B2B]/90 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-[#E4E0D6] overflow-hidden flex flex-col">
      {/* Header controls & Filters */}
      <div className="p-4 sm:p-5 border-b border-[#E4E0D6] bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-[#EEF6F1] text-[#0F5C42]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#1C1B22] font-serif flex items-center gap-2">
                <span>Asset Cyber Risk Portfolio</span>
                <span className="text-[11px] font-mono text-[#0F5C42] bg-[#EEF6F1] px-2 py-0.5 rounded border border-[#E4E0D6]">
                  {processedAssets.length} displayed ({assets.length} total)
                </span>
              </h3>
              <p className="text-[11px] text-[#7E7C88]">
                Displaying assets with quantified financial exposure. Click any row to inspect loss exceedance curves.
              </p>
            </div>
          </div>

          {/* Search Box & Quick Toggle */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#7E7C88] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search asset, BU, or criticality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F5F0] border border-[#E4E0D6] rounded text-[#1C1B22] placeholder-[#7E7C88] focus:outline-none focus:bg-white focus:border-[#0F5C42] transition-colors"
              />
            </div>

            {zeroRiskAssetsCount > 0 && !searchTerm.trim() && (
              <button
                onClick={() => setShowZeroRisk(!showZeroRisk)}
                className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap ${
                  showZeroRisk
                    ? 'bg-[#0F5C42] text-white border-[#0F5C42]'
                    : 'bg-[#F7F5F0] text-[#4A4852] hover:text-[#1C1B22] border-[#E4E0D6]'
                }`}
                title={showZeroRisk ? 'Hide assets with $0 EAL' : 'Show assets with $0 EAL'}
              >
                <span>{showZeroRisk ? 'Hide $0 EAL' : `+${zeroRiskAssetsCount} Zero-Risk`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Business Unit Quick Filter Pills */}
        {businessUnits.length > 2 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[#7E7C88] text-[11px] font-medium flex items-center mr-1">
              <Filter className="w-3 h-3 mr-1 text-[#7E7C88]" /> Filter BU:
            </span>
            {businessUnits.map((bu) => (
              <button
                key={bu}
                onClick={() => setSelectedBU(bu)}
                className={`px-2.5 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedBU === bu
                    ? 'bg-[#0F5C42] text-white border-[#0F5C42]'
                    : 'bg-[#F7F5F0] text-[#4A4852] hover:text-[#1C1B22] hover:bg-[#EAE6DB] border-[#E4E0D6]'
                }`}
              >
                {bu === 'ALL' ? 'All Units' : bu}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#F7F5F0] border-b border-[#E4E0D6] text-[11px] font-semibold text-[#4A4852]">
            <tr>
              <th
                onClick={() => handleSort('asset_id')}
                className="py-2.5 px-4 cursor-pointer hover:text-[#1C1B22] group transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Asset ID</span>
                  {getSortIcon('asset_id')}
                </div>
              </th>
              <th
                onClick={() => handleSort('business_unit')}
                className="py-2.5 px-4 cursor-pointer hover:text-[#1C1B22] group transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Business Unit</span>
                  {getSortIcon('business_unit')}
                </div>
              </th>
              <th
                onClick={() => handleSort('criticality')}
                className="py-2.5 px-4 cursor-pointer hover:text-[#1C1B22] group transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Criticality</span>
                  {getSortIcon('criticality')}
                </div>
              </th>
              <th
                onClick={() => handleSort('EAL_usd')}
                className="py-2.5 px-4 cursor-pointer hover:text-[#1C1B22] group transition-colors text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Expected Loss (EAL)</span>
                  {getSortIcon('EAL_usd')}
                </div>
              </th>
              <th
                onClick={() => handleSort('VaR95_usd')}
                className="py-2.5 px-4 cursor-pointer hover:text-[#1C1B22] group transition-colors text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>VaR 95%</span>
                  {getSortIcon('VaR95_usd')}
                </div>
              </th>
              <th
                onClick={() => handleSort('priority_score')}
                className="py-2.5 px-4 cursor-pointer hover:text-[#1C1B22] group transition-colors text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Priority Score</span>
                  {getSortIcon('priority_score')}
                </div>
              </th>
              <th className="py-2.5 px-3 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E0D6] text-xs">
            {processedAssets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7E7C88]">
                  No assets match the search criteria.
                </td>
              </tr>
            ) : (
              processedAssets.map((asset) => {
                const isTop5 = top5AssetIds.has(asset.asset_id);
                const isSelected = selectedAssetId === asset.asset_id;
                const isZeroEal = (asset.EAL_usd || 0) === 0;

                return (
                  <tr
                    key={asset.asset_id}
                    onClick={() => onSelectAsset(asset.asset_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EEF6F1] border-l-4 border-l-[#0F5C42]'
                        : isTop5
                        ? 'bg-[#F9ECEC]/35 hover:bg-[#F9ECEC]/65'
                        : isZeroEal
                        ? 'bg-[#F7F5F0]/60 hover:bg-[#F7F5F0]'
                        : 'hover:bg-[#F7F5F0]'
                    }`}
                  >
                    {/* Asset ID */}
                    <td className="py-3 px-4 font-mono font-medium text-[#1C1B22]">
                      <div className="flex items-center space-x-2">
                        <span>{asset.asset_id}</span>
                        {isTop5 && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F9ECEC] text-[#A32B2B] border border-[#A32B2B]/20"
                            title="Top 5 Enterprise Risk Contributor"
                          >
                            TOP 5
                          </span>
                        )}
                        {isZeroEal && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-[#7E7C88] bg-[#EAE6DB] border border-[#E4E0D6]"
                            title="Zero quantified baseline risk"
                          >
                            $0 EAL
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Business Unit */}
                    <td className="py-3 px-4 text-[#4A4852]">
                      {asset.business_unit}
                    </td>

                    {/* Criticality */}
                    <td className="py-3 px-4">
                      {getCriticalityBadge(asset.criticality)}
                    </td>

                    {/* EAL */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1C1B22] tabular-nums">
                      {isZeroEal ? (
                        <span className="text-[#7E7C88] font-normal">$0</span>
                      ) : (
                        formatCurrency(asset.EAL_usd)
                      )}
                    </td>

                    {/* VaR95 */}
                    <td className="py-3 px-4 text-right font-mono text-[#B8752B] font-medium tabular-nums">
                      {isZeroEal ? (
                        <span className="text-[#7E7C88] font-normal">$0</span>
                      ) : (
                        formatCurrency(asset.VaR95_usd)
                      )}
                    </td>

                    {/* Priority Score */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#F7F5F0] text-[#4A4852] border border-[#E4E0D6]">
                        {asset.priority_score !== undefined
                          ? Number(asset.priority_score).toFixed(1)
                          : '—'}
                      </span>
                    </td>

                    {/* Action Icon */}
                    <td className="py-3 px-3 text-center text-[#7E7C88] group-hover:text-[#0F5C42]">
                      <ChevronRight className="w-3.5 h-3.5 mx-auto" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Collapsible Banner for 0 EAL Assets */}
      {zeroRiskAssetsCount > 0 && !searchTerm.trim() && (
        <div className="p-3.5 px-4 bg-[#F7F5F0] border-t border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#4A4852]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#0F5C42] shrink-0" />
            <span>
              {showZeroRisk ? (
                <>
                  Showing all <strong>{zeroRiskAssetsCount} assets</strong> with zero quantified loss ($0 EAL).
                </>
              ) : (
                <>
                  <strong>{zeroRiskAssetsCount} assets</strong> have zero active vulnerabilities or zero quantified loss ($0 EAL) and are hidden from the primary view.
                </>
              )}
            </span>
          </div>

          <button
            onClick={() => setShowZeroRisk(!showZeroRisk)}
            className="inline-flex items-center justify-center space-x-1 px-3.5 py-1.5 rounded bg-white hover:bg-[#FAF6ED] text-[#0F5C42] font-medium border border-[#E4E0D6] shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>{showZeroRisk ? 'Hide $0 EAL Assets' : `Show ${zeroRiskAssetsCount} Zero-Risk Assets`}</span>
            {showZeroRisk ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#0F5C42]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#0F5C42]" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};



