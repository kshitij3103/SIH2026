import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Health check endpoint
 */
export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Enterprise organization risk metrics
 */
export const getOrgRisk = async () => {
  const response = await apiClient.get('/risk/organization');
  // Returns list of records or single object
  if (Array.isArray(response.data)) {
    return response.data[0] || {};
  }
  return response.data || {};
};

/**
 * Business unit risk metrics
 */
export const getBusinessUnits = async () => {
  const response = await apiClient.get('/risk/business-units');
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * All assets risk summary
 */
export const getAssets = async () => {
  const response = await apiClient.get('/risk/assets');
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Detailed single asset record
 */
export const getAssetDetail = async (assetId) => {
  const response = await apiClient.get(`/risk/assets/${encodeURIComponent(assetId)}`);
  return response.data;
};

/**
 * Control scenarios raw list
 */
export const getControlsScenarios = async () => {
  const response = await apiClient.get('/controls/scenarios');
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Ranked controls by overall ROSI
 */
export const getControlsRoi = async () => {
  const response = await apiClient.get('/controls/roi');
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * ILP-based Investment optimizer
 * @param {number} budget - Budget in USD
 * @param {boolean} oneControlPerAsset - Restrict to at most 1 control per asset
 */
export const getOptimizedPlan = async (budget, oneControlPerAsset = true) => {
  const response = await apiClient.get('/controls/optimize', {
    params: {
      budget,
      one_control_per_asset: oneControlPerAsset,
    },
  });
  return response.data;
};

/**
 * AI Chatbot assistant query
 * @param {string} message - User question
 * @param {Array<{role: string, content: string}>} history - Conversation history
 */
export const sendChatMessage = async (message, history = []) => {
  const response = await apiClient.post('/chat', {
    message,
    history,
  });
  return response.data;
};

/**
 * Currency formatter: $1,234,567
 */
export const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '$0';
  const num = Math.round(Number(val));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Percentage formatter: 94.2%
 */
export const formatPercent = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0%';
  return `${Number(val).toFixed(decimals)}%`;
};

/**
 * ROSI multiplier formatter: 4.25x
 */
export const formatMultiplier = (val, decimals = 2) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.00x';
  return `${Number(val).toFixed(decimals)}x`;
};
