const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

const DREAMING_ZEBRA = 'dreaming_zebra';
const DREAM_ZERO = 'DreamZero';

/**
 * Convenience wrapper for GET requests.
 * Usage: apiGet('/leaderboard').then(r => r.json())
 */
export function apiGet(path, init = {}) {
  return fetch(`${API_BASE}${path}`, { ...init });
}

export function renamePolicyForUi(name) {
  if (typeof name !== 'string') return name;
  return name.trim().toLowerCase() === DREAMING_ZEBRA ? DREAM_ZERO : name;
}

function normalizeLeaderboardPayload(payload) {
  if (!payload || !Array.isArray(payload.board)) return payload;
  return {
    ...payload,
    board: payload.board.map((row) => ({
      ...row,
      policy: renamePolicyForUi(row.policy),
    })),
  };
}

function normalizeAbEvaluationsPayload(payload) {
  if (!payload || !Array.isArray(payload.evaluations)) return payload;
  return {
    ...payload,
    evaluations: payload.evaluations.map((evaluation) => ({
      ...evaluation,
      policyA: {
        ...evaluation.policyA,
        name: renamePolicyForUi(evaluation.policyA?.name),
      },
      policyB: {
        ...evaluation.policyB,
        name: renamePolicyForUi(evaluation.policyB?.name),
      },
    })),
  };
}

function normalizeApiJson(path, payload) {
  if (path === '/leaderboard') return normalizeLeaderboardPayload(payload);
  if (path === '/list_ab_evaluations') return normalizeAbEvaluationsPayload(payload);
  return payload;
}

export async function apiGetJson(path, init = {}) {
  const response = await apiGet(path, init);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }
  const payload = await response.json();
  return normalizeApiJson(path, payload);
}
