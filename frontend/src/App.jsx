import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { ExecutiveSummary } from './components/dashboard/ExecutiveSummary';
import { BusinessUnitChart } from './components/dashboard/BusinessUnitChart';
import { AssetRiskTable } from './components/dashboard/AssetRiskTable';
import { AssetDetailPanel } from './components/dashboard/AssetDetailPanel';
import { ControlsROIChart } from './components/dashboard/ControlsROIChart';
import { WhatIfOptimizer } from './components/dashboard/WhatIfOptimizer';
import { ChatWidget } from './components/chatbot/ChatWidget';
import { useApi } from './hooks/useApi';
import { getOrgRisk, getBusinessUnits, getAssets, getControlsRoi } from './api/client';
import {
  Server,
  Zap,
  Award,
  Shield,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API hooks
  const orgRisk = useApi(getOrgRisk);
  const businessUnits = useApi(getBusinessUnits);
  const assets = useApi(getAssets);
  const controlsRoi = useApi(getControlsRoi);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        orgRisk.refetch(),
        businessUnits.refetch(),
        assets.refetch(),
        controlsRoi.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const orgEal = orgRisk.data?.eal_usd ?? orgRisk.data?.EAL_usd ?? 0;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1B22] flex flex-col font-sans">

      {/* Top Navigation */}
      <Header
        onRefreshAll={handleRefreshAll}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-7">

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-7">
            {/* Top Stat Tiles & Hero */}
            <ExecutiveSummary
              data={orgRisk.data}
              loading={orgRisk.loading}
              error={orgRisk.error}
              statusCode={orgRisk.statusCode}
              onRetry={orgRisk.refetch}
            />

            {/* Middle Section: Business Units & Controls ROI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <BusinessUnitChart
                  data={businessUnits.data}
                  loading={businessUnits.loading}
                  error={businessUnits.error}
                  onRetry={businessUnits.refetch}
                />
              </div>

              <div className="lg:col-span-6">
                <ControlsROIChart
                  data={controlsRoi.data}
                  loading={controlsRoi.loading}
                  error={controlsRoi.error}
                  onRetry={controlsRoi.refetch}
                />
              </div>
            </div>


          </div>
        )}

        {/* TAB 2: ASSET PORTFOLIO */}
        {activeTab === 'assets' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E4E0D6] pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#1C1B22] font-serif flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#0F5C42]" />
                  <span>Asset Cyber Risk Portfolio & Threat Analysis</span>
                </h2>
                <p className="text-xs text-[#4A4852] mt-0.5">
                  Comprehensive Open FAIR™ quantitative financial loss modeling across operational assets.
                </p>
              </div>
            </div>

            <AssetRiskTable
              assets={assets.data}
              loading={assets.loading}
              error={assets.error}
              onSelectAsset={(id) => setSelectedAssetId(id)}
              selectedAssetId={selectedAssetId}
            />
          </div>
        )}

        {/* TAB 3: CONTROLS & ROI */}
        {activeTab === 'controls' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E4E0D6] pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#1C1B22] font-serif flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#0F5C42]" />
                  <span>Security Controls & Investment Return (ROSI)</span>
                </h2>
                <p className="text-xs text-[#4A4852] mt-0.5">
                  Benchmarked risk reduction efficiency for defense-in-depth security engineering.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ControlsROIChart
                  data={controlsRoi.data}
                  loading={controlsRoi.loading}
                  error={controlsRoi.error}
                  onRetry={controlsRoi.refetch}
                />
              </div>

              <div className="lg:col-span-5 bg-white rounded-md p-6 border border-[#E4E0D6] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-[#0F5C42]">
                    <Zap className="w-4 h-4" />
                    <h3 className="text-sm font-semibold text-[#1C1B22] font-serif">ROSI Formula & Actuarial Methodology</h3>
                  </div>
                  <div className="p-3.5 rounded bg-[#F7F5F0] border border-[#E4E0D6] text-xs font-mono text-[#1C1B22]">
                    ROSI = (Risk Reduction USD) / (Control Cost USD)
                  </div>
                  <p className="text-xs text-[#4A4852] leading-relaxed">
                    Controls are ranked by their ability to reduce annualized loss per dollar spent. A ROSI of <strong className="text-[#1C1B22]">3.5x</strong> indicates each $1 invested in security engineering mitigates $3.50 in Expected Annual Loss.
                  </p>
                </div>

                <div className="mt-5 p-4 rounded bg-[#0F5C42] text-white text-xs">
                  <span className="font-semibold block mb-1 font-serif">Next Step: </span>
                  Switch to the <strong>Investment Optimizer</strong> tab to allocate a constrained security budget automatically using the exact Knapsack ILP algorithm.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WHAT-IF OPTIMIZER */}
        {activeTab === 'optimizer' && (
          <div className="space-y-5">
            <WhatIfOptimizer orgEal={orgEal} />
          </div>
        )}

      </main>

      {/* Asset Drilldown Side Panel */}
      {selectedAssetId && (
        <AssetDetailPanel
          assetId={selectedAssetId}
          onClose={() => setSelectedAssetId(null)}
        />
      )}

      {/* Floating AI Chatbot Widget */}
      <ChatWidget />

      {/* Modern Editorial Footer */}
      <footer className="border-t border-[#E4E0D6] bg-white py-8 text-xs text-[#4A4852] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-[#0F5C42] flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[#1C1B22] font-serif text-sm">CyberRisk Platform</span>
          </div>
          <span className="text-center sm:text-left text-[#7E7C88]">
            SIH Problem Statement 26105 • AI-Powered Continuous FAIR Cyber Risk Quantification & ILP Optimizer
          </span>
          <div className="flex items-center space-x-2 text-[11px] font-medium text-[#0F5C42] bg-[#EEF6F1] px-3 py-1 rounded border border-[#E4E0D6] font-mono">
            <span>Open FAIR™</span> • <span>Monte Carlo (N=10k)</span> • <span>Knapsack ILP</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;



