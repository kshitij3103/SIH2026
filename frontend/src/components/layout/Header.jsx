import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, Layers, Server, Sliders } from 'lucide-react';
import { getHealth } from '../../api/client';

export const Header = ({ onRefreshAll, isRefreshing, activeTab, setActiveTab }) => {
  const [backendOnline, setBackendOnline] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await getHealth();
      setBackendOnline(res?.status === 'ok');
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: Layers },
    { id: 'assets', label: 'Asset Portfolio', icon: Server },
    { id: 'optimizer', label: 'Investment Optimizer', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E4E0D6] bg-[#FFFFFF]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 py-2">

          {/* Logo & Product Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#0F5C42] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-[#1C1B22] font-serif tracking-tight">
                  CyberRisk
                </span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#FAF6ED] text-[#9A7B2F] border border-[#E4E0D6]">
                  FAIR™ Actuarial
                </span>
              </div>
              <p className="text-[11px] text-[#7E7C88] hidden sm:block">
                Board-Level Quantitative Risk & Financial Solvency Modeling
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop/Tablet) */}
          <nav className="hidden md:flex items-center space-x-1 border-b-2 border-transparent">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium transition-all relative ${
                    isActive
                      ? 'text-[#0F5C42] font-semibold'
                      : 'text-[#4A4852] hover:text-[#1C1B22] hover:bg-[#F7F5F0] rounded'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F5C42]' : 'text-[#7E7C88]'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0F5C42] rounded-full -mb-3" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Badge & Action Button */}
          <div className="flex items-center space-x-2.5">
            {/* Backend Health Badge */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-medium border ${
                backendOnline === true
                  ? 'bg-[#EEF6F1] text-[#3D7A52] border-[#E4E0D6]'
                  : backendOnline === false
                  ? 'bg-[#F9ECEC] text-[#A32B2B] border-[#E4E0D6]'
                  : 'bg-[#F7F5F0] text-[#7E7C88] border-[#E4E0D6]'
              }`}
              title={
                backendOnline === true
                  ? 'FastAPI Engine Online (http://localhost:8000)'
                  : backendOnline === false
                  ? 'FastAPI Engine Offline'
                  : 'Connecting...'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendOnline === true
                    ? 'bg-[#0F5C42]'
                    : backendOnline === false
                    ? 'bg-[#A32B2B]'
                    : 'bg-[#7E7C88]'
                }`}
              />
              <span className="hidden sm:inline">
                {backendOnline === true
                  ? 'Engine Online'
                  : backendOnline === false
                  ? 'Engine Offline'
                  : 'Connecting...'}
              </span>
            </div>

            {/* Emerald Action Button */}
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded bg-[#0F5C42] hover:bg-[#0B4733] text-white text-xs font-medium transition-colors shadow-xs active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
              title="Refresh Portfolio Risk Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Report</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center space-x-1 py-2 overflow-x-auto border-t border-[#E4E0D6]">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0F5C42] text-white'
                  : 'text-[#4A4852] hover:text-[#1C1B22] bg-[#F7F5F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
};



