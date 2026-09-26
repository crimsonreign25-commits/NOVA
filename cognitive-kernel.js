import * as stubs from './nova-stubs.js';

// Keep the cognitive-kernel contract stable even when the provider-independent
// implementation returns a partial analysis object. Callers rely on
// `analysis.capabilities` being an array for capability routing decisions.
export const KERNEL_VERSION = stubs.KERNEL_VERSION;

export function analyzeGoal(options = {}) {
  const raw = stubs.analyzeGoal(options) || {};
  const sourceAnalysis = raw.analysis && typeof raw.analysis === 'object'
    ? raw.analysis
    : raw;
  const analysis = {
    ...sourceAnalysis,
    capabilities: Array.isArray(sourceAnalysis.capabilities)
      ? sourceAnalysis.capabilities
      : [],
  };

  return raw.analysis && typeof raw.analysis === 'object'
    ? { ...raw, analysis }
    : analysis;
}

export const selectContext = stubs.selectContext;
export const routeCapabilities = stubs.routeCapabilities;
export const createTaskState = stubs.createTaskState;
