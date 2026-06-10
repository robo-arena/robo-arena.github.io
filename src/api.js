const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

const POLICY_UI_ALIASES = {
  dreaming_zebra: 'DreamZero',
  'cosmos3-nano-policy': 'balsomsoc',
  'j2-vla': 'Spirit v1.6',
  yckmtchl: 'Cosmos3-Nano-Policy',
};

/**
 * Convenience wrapper for GET requests.
 * Usage: apiGet('/leaderboard').then(r => r.json())
 */
export function apiGet(path, init = {}) {
  return fetch(`${API_BASE}${path}`, { ...init });
}

export function renamePolicyForUi(name) {
  if (typeof name !== 'string') return name;
  const normalized = name.trim().toLowerCase();
  return POLICY_UI_ALIASES[normalized] ?? name;
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

function normalizeLeaderboardImpactPayload(payload) {
  const normalizeBoardRow = (row) => ({
    ...row,
    policy: renamePolicyForUi(row.policy),
    numEvals: row.num_evals ?? row.numEvals,
  });
  const normalizeChange = (change) => ({
    policy: renamePolicyForUi(change.policy),
    baseRank: change.base_rank,
    withoutRank: change.without_rank,
    rankDelta: change.rank_delta,
    baseScore: change.base_score,
    withoutScore: change.without_score,
    scoreDelta: change.score_delta,
    baseEvals: change.base_evals,
    withoutEvals: change.without_evals,
  });
  const normalizeOrgImpact = (impact) => ({
    status: impact.status,
    label: impact.label,
    source: impact.source,
    generatedAt: impact.generated_at ?? impact.generatedAt,
    cacheStale: impact.cache_stale ?? impact.cacheStale,
    baseline: (impact.baseline || []).map(normalizeBoardRow),
    withoutOrg: (impact.without_org || impact.withoutOrg || []).map(normalizeBoardRow),
    topChanges: (impact.top_changes || impact.topChanges || []).map(normalizeChange),
    largestChange: impact.largest_change ? normalizeChange(impact.largest_change) : null,
    maxAbsRankDelta: impact.max_abs_rank_delta ?? impact.maxAbsRankDelta,
    maxAbsScoreDelta: impact.max_abs_score_delta ?? impact.maxAbsScoreDelta,
  });

  if (!payload) return payload;
  if (!payload.by_org) {
    return {
      ...normalizeOrgImpact(payload),
      officialPolicyEvalThreshold:
        payload.official_policy_eval_threshold ?? payload.officialPolicyEvalThreshold,
    };
  }

  return {
    generatedAt: payload.generated_at,
    source: payload.source,
    officialPolicyEvalThreshold:
      payload.official_policy_eval_threshold ?? payload.officialPolicyEvalThreshold,
    baseline: (payload.baseline || []).map(normalizeBoardRow),
    byOrg: Object.fromEntries(
      Object.entries(payload.by_org).map(([label, impact]) => [
        label,
        normalizeOrgImpact(impact),
      ])
    ),
    largestOrgImpact: payload.largest_org_impact
      ? normalizeOrgImpact(payload.largest_org_impact)
      : null,
  };
}

function normalizeApiJson(path, payload) {
  const pathname = path.split('?')[0];
  if (pathname === '/leaderboard') return normalizeLeaderboardPayload(payload);
  if (pathname === '/list_ab_evaluations') return normalizeAbEvaluationsPayload(payload);
  if (pathname === '/evaluator_leaderboard_impact') {
    return normalizeLeaderboardImpactPayload(payload);
  }
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
