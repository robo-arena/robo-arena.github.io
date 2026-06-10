const UNKNOWN_ORG = 'Unknown organization';
const UNKNOWN_EVALUATOR = 'Unknown evaluator';
const RANKING_EXCLUDED_POLICIES = new Set(['pi0', 'pi0_fast']);
const OFFICIAL_POLICY_EVAL_THRESHOLD = 100;

function cleanLabel(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function percent(count, total) {
  if (!total) return 0;
  return (count / total) * 100;
}

function roundPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function isoOrNull(value) {
  if (!Number.isFinite(value)) return null;
  return new Date(value).toISOString();
}

function updateDateRange(target, timeMs) {
  if (!Number.isFinite(timeMs)) return;
  target.firstTimeMs = Math.min(target.firstTimeMs, timeMs);
  target.lastTimeMs = Math.max(target.lastTimeMs, timeMs);
}

function monthKey(timeMs) {
  if (!Number.isFinite(timeMs)) return null;
  const date = new Date(timeMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

function recentMonthBuckets(months, lastTimeMs, bucketCount = 6) {
  if (!Number.isFinite(lastTimeMs)) return [];
  const latest = new Date(lastTimeMs);
  const buckets = [];

  for (let i = bucketCount - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: monthLabel(key),
      count: months.get(key) || 0,
    });
  }

  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return buckets.map((bucket) => ({
    ...bucket,
    percent: roundPercent(percent(bucket.count, max)),
  }));
}

function sortedCounterItems(counter, total, limit = 6) {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      percent: roundPercent(percent(count, total)),
    }));
}

function createOutcomeCounter(label) {
  return {
    label,
    count: 0,
    wins: 0,
    losses: 0,
    ties: 0,
  };
}

function updateOutcomeCounter(counter, outcome) {
  counter.count += 1;
  if (outcome === 'win') counter.wins += 1;
  else if (outcome === 'loss') counter.losses += 1;
  else if (outcome === 'tie') counter.ties += 1;
}

function sortedOutcomeCounterItems(counter, total, limit = Infinity) {
  return [...counter.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((item) => ({
      ...item,
      percent: roundPercent(percent(item.count, total)),
      winRate: nonTieRate(item.wins, item.losses),
      tieRate: roundPercent(percent(item.ties, item.count)),
    }));
}

function createPolicyStats(policy) {
  return {
    policy,
    evals: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    labs: new Map(),
    evaluators: new Map(),
    opponents: new Map(),
    months: new Map(),
    firstTimeMs: Infinity,
    lastTimeMs: -Infinity,
  };
}

function createOpponentStats(policy) {
  return {
    policy,
    count: 0,
    wins: 0,
    losses: 0,
    ties: 0,
  };
}

function createContributorStats(label) {
  return {
    label,
    count: 0,
    policies: new Map(),
    pairs: new Map(),
    evaluators: new Set(),
    months: new Map(),
    recentEvaluations: [],
    ties: 0,
    firstTimeMs: Infinity,
    lastTimeMs: -Infinity,
  };
}

function createPairStats(policy1, policy2) {
  return {
    policy1,
    policy2,
    count: 0,
    policy1Wins: 0,
    policy2Wins: 0,
    ties: 0,
    labs: new Set(),
    evaluators: new Set(),
    firstTimeMs: Infinity,
    lastTimeMs: -Infinity,
  };
}

function createContributorPairStats(policy1, policy2) {
  return {
    policy1,
    policy2,
    count: 0,
    ties: 0,
  };
}

function preferenceWinner(evaluation) {
  const preference = (evaluation.preference || '').toUpperCase();
  if (preference === 'A') return evaluation.policyA?.name || null;
  if (preference === 'B') return evaluation.policyB?.name || null;
  return null;
}

export function isRankingIncludedEvaluation(evaluation) {
  const policyA = evaluation.policyA?.name;
  const policyB = evaluation.policyB?.name;
  if (!policyA || !policyB) return false;
  return ![policyA, policyB].some((policy) =>
    RANKING_EXCLUDED_POLICIES.has(policy.trim().toLowerCase())
  );
}

function outcomeForPolicy(policy, evaluation) {
  const preference = (evaluation.preference || '').toUpperCase();
  if (preference === 'TIE') return 'tie';
  if (preference === 'A') return evaluation.policyA?.name === policy ? 'win' : 'loss';
  if (preference === 'B') return evaluation.policyB?.name === policy ? 'win' : 'loss';
  return null;
}

function finalizePolicyStats(stats) {
  const topLabCount = Math.max(0, ...[...stats.labs.values()].map((lab) => lab.count));
  const opponents = [...stats.opponents.values()]
    .sort((a, b) => b.count - a.count || a.policy.localeCompare(b.policy))
    .map((opponent) => ({
      ...opponent,
      winRate: nonTieRate(opponent.wins, opponent.losses),
      tieRate: roundPercent(percent(opponent.ties, opponent.count)),
    }));

  return {
    policy: stats.policy,
    evals: stats.evals,
    wins: stats.wins,
    losses: stats.losses,
    ties: stats.ties,
    winRate: nonTieRate(stats.wins, stats.losses),
    tieRate: roundPercent(percent(stats.ties, stats.evals)),
    labCount: stats.labs.size,
    evaluatorCount: stats.evaluators.size,
    opponentCount: stats.opponents.size,
    topLabShare: roundPercent(percent(topLabCount, stats.evals)),
    labs: sortedOutcomeCounterItems(stats.labs, stats.evals),
    evaluators: sortedCounterItems(stats.evaluators, stats.evals, 8),
    opponents,
    recentActivity: recentMonthBuckets(stats.months, stats.lastTimeMs),
    firstEvalAt: isoOrNull(stats.firstTimeMs),
    lastEvalAt: isoOrNull(stats.lastTimeMs),
  };
}

function nonTieRate(wins, losses) {
  const total = wins + losses;
  if (!total) return null;
  return roundPercent(percent(wins, total));
}

function finalizeContributorStats(stats) {
  const policies = [...stats.policies.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([policy, count]) => ({
      policy,
      count,
      percent: roundPercent(percent(count, stats.count)),
    }));
  const pairs = [...stats.pairs.values()]
    .sort((a, b) => b.count - a.count || a.policy1.localeCompare(b.policy1))
    .map((pair) => ({
      ...pair,
      tieRate: roundPercent(percent(pair.ties, pair.count)),
    }));
  const recentEvaluations = [...stats.recentEvaluations]
    .sort((a, b) => Date.parse(b.completionTime) - Date.parse(a.completionTime))
    .slice(0, 6);

  return {
    label: stats.label,
    count: stats.count,
    policyCount: stats.policies.size,
    pairCount: stats.pairs.size,
    evaluatorCount: stats.evaluators.size,
    tieRate: roundPercent(percent(stats.ties, stats.count)),
    policies,
    pairs,
    recentActivity: recentMonthBuckets(stats.months, stats.lastTimeMs),
    recentEvaluations,
    firstEvalAt: isoOrNull(stats.firstTimeMs),
    lastEvalAt: isoOrNull(stats.lastTimeMs),
  };
}

function finalizePairStats(stats) {
  return {
    policy1: stats.policy1,
    policy2: stats.policy2,
    count: stats.count,
    policy1Wins: stats.policy1Wins,
    policy2Wins: stats.policy2Wins,
    ties: stats.ties,
    labCount: stats.labs.size,
    evaluatorCount: stats.evaluators.size,
    tieRate: roundPercent(percent(stats.ties, stats.count)),
    firstEvalAt: isoOrNull(stats.firstTimeMs),
    lastEvalAt: isoOrNull(stats.lastTimeMs),
  };
}

function normalizeRequestStats(requestStats) {
  if (!requestStats || !Array.isArray(requestStats.organizations)) {
    return { byOrg: {}, totals: null, largestRejection: null };
  }

  const byOrg = Object.fromEntries(
    requestStats.organizations.map((org) => [org.label, org])
  );
  const minimumRequestedForDropoffSignal = 100;
  const largestRejection =
    requestStats.organizations
      .filter((org) => org.requested >= minimumRequestedForDropoffSignal)
      .sort(
        (a, b) =>
          (b.rejection_rate || 0) - (a.rejection_rate || 0) ||
          b.requested - a.requested ||
          a.label.localeCompare(b.label)
      )[0] || null;

  return {
    byOrg,
    totals: requestStats.totals || null,
    largestRejection,
    minimumRequestedForDropoffSignal,
    generatedAt: requestStats.generated_at,
    source: requestStats.source,
  };
}

function buildIntegritySignals({
  totalEvals,
  policies,
  evaluatorOrganizations,
  pairs,
  requestStats,
}) {
  const officialPolicies = policies.filter(
    (policy) => policy.evals >= OFFICIAL_POLICY_EVAL_THRESHOLD
  );
  const coveragePolicies = officialPolicies.length
    ? officialPolicies
    : policies.filter((policy) => policy.evals >= 20);
  const topOrg = evaluatorOrganizations[0] || null;
  const topPair = pairs[0] || null;

  const highestPolicyOrgShare = coveragePolicies
    .filter((policy) => policy.labs.length > 0)
    .map((policy) => ({
      policy: policy.policy,
      evals: policy.evals,
      evaluatorOrg: policy.labs[0].label,
      evaluatorOrgEvals: policy.labs[0].count,
      percent: policy.topLabShare,
      labCount: policy.labCount,
    }))
    .sort((a, b) => b.percent - a.percent || b.evals - a.evals)[0] || null;

  const thinOfficialCoveragePolicies = officialPolicies
    .filter((policy) => policy.labCount < 3)
    .sort((a, b) => a.labCount - b.labCount || b.evals - a.evals)
    .map((policy) => ({
      policy: policy.policy,
      evals: policy.evals,
      evaluatorOrgs: policy.labCount,
      topOrgShare: policy.topLabShare,
    }));

  return {
    officialPolicyEvalThreshold: OFFICIAL_POLICY_EVAL_THRESHOLD,
    minimumRequestedForDropoffSignal: requestStats.minimumRequestedForDropoffSignal,
    largestRejection: requestStats.largestRejection,
    largestOrgShare: topOrg
      ? {
          evaluatorOrg: topOrg.label,
          evals: topOrg.count,
          percent: roundPercent(percent(topOrg.count, totalEvals)),
        }
      : null,
    highestPolicyOrgShare,
    thinOfficialCoverage: {
      count: thinOfficialCoveragePolicies.length,
      policies: thinOfficialCoveragePolicies.slice(0, 8),
    },
    pairConcentration: topPair
      ? {
          policy1: topPair.policy1,
          policy2: topPair.policy2,
          evals: topPair.count,
          percent: roundPercent(percent(topPair.count, totalEvals)),
          evaluatorOrgs: topPair.labCount,
        }
      : null,
  };
}

export function buildTransparencyStats(evaluations = [], requestStatsPayload = null) {
  const policies = new Map();
  const evaluatorOrganizations = new Map();
  const evaluatorAccounts = new Map();
  const pairs = new Map();
  const globalMonths = new Map();

  let totalEvals = 0;
  let tieCount = 0;
  let firstTimeMs = Infinity;
  let lastTimeMs = -Infinity;

  for (const evaluation of evaluations) {
    const policyA = evaluation.policyA?.name;
    const policyB = evaluation.policyB?.name;
    if (!policyA || !policyB) continue;
    if (!isRankingIncludedEvaluation(evaluation)) continue;

    const preference = (evaluation.preference || '').toUpperCase();
    if (!['A', 'B', 'TIE'].includes(preference)) continue;

    const lab = cleanLabel(evaluation.university, UNKNOWN_ORG);
    const evaluator = cleanLabel(evaluation.evaluator_name, UNKNOWN_EVALUATOR);
    const timeMs = Date.parse(evaluation.completion_time);
    const month = monthKey(timeMs);
    const sortedPolicies = [policyA, policyB].sort((a, b) => a.localeCompare(b));
    const pairKey = `${sortedPolicies[0]}|||${sortedPolicies[1]}`;
    const winner = preferenceWinner(evaluation);
    const recentEval = {
      sessionId: evaluation.session_id,
      completionTime: evaluation.completion_time,
      evaluator,
      preference,
      policyA,
      policyB,
      languageInstruction: evaluation.language_instruction,
    };

    totalEvals += 1;
    if (preference === 'TIE') tieCount += 1;
    if (month) increment(globalMonths, month);
    if (Number.isFinite(timeMs)) {
      firstTimeMs = Math.min(firstTimeMs, timeMs);
      lastTimeMs = Math.max(lastTimeMs, timeMs);
    }

    if (!pairs.has(pairKey)) {
      pairs.set(pairKey, createPairStats(sortedPolicies[0], sortedPolicies[1]));
    }
    const pairStats = pairs.get(pairKey);
    pairStats.count += 1;
    pairStats.labs.add(lab);
    pairStats.evaluators.add(evaluator);
    updateDateRange(pairStats, timeMs);
    if (preference === 'TIE') pairStats.ties += 1;
    else if (winner === pairStats.policy1) pairStats.policy1Wins += 1;
    else if (winner === pairStats.policy2) pairStats.policy2Wins += 1;

    for (const [collection, label] of [
      [evaluatorOrganizations, lab],
      [evaluatorAccounts, evaluator],
    ]) {
      if (!collection.has(label)) collection.set(label, createContributorStats(label));
      const stats = collection.get(label);
      stats.count += 1;
      increment(stats.policies, policyA);
      increment(stats.policies, policyB);
      stats.evaluators.add(evaluator);
      if (!stats.pairs.has(pairKey)) {
        stats.pairs.set(pairKey, createContributorPairStats(sortedPolicies[0], sortedPolicies[1]));
      }
      const contributorPairStats = stats.pairs.get(pairKey);
      contributorPairStats.count += 1;
      if (preference === 'TIE') contributorPairStats.ties += 1;
      if (month) increment(stats.months, month);
      stats.recentEvaluations.push(recentEval);
      if (preference === 'TIE') stats.ties += 1;
      updateDateRange(stats, timeMs);
    }

    for (const [policy, opponent] of [
      [policyA, policyB],
      [policyB, policyA],
    ]) {
      if (!policies.has(policy)) policies.set(policy, createPolicyStats(policy));
      const stats = policies.get(policy);
      const outcome = outcomeForPolicy(policy, evaluation);

      stats.evals += 1;
      if (!stats.labs.has(lab)) stats.labs.set(lab, createOutcomeCounter(lab));
      updateOutcomeCounter(stats.labs.get(lab), outcome);
      stats.evaluators.set(evaluator, (stats.evaluators.get(evaluator) || 0) + 1);
      if (month) increment(stats.months, month);
      updateDateRange(stats, timeMs);

      if (!stats.opponents.has(opponent)) {
        stats.opponents.set(opponent, createOpponentStats(opponent));
      }
      const opponentStats = stats.opponents.get(opponent);
      opponentStats.count += 1;

      if (outcome === 'win') {
        stats.wins += 1;
        opponentStats.wins += 1;
      } else if (outcome === 'loss') {
        stats.losses += 1;
        opponentStats.losses += 1;
      } else if (outcome === 'tie') {
        stats.ties += 1;
        opponentStats.ties += 1;
      }
    }
  }

  const policyList = [...policies.values()]
    .map(finalizePolicyStats)
    .sort((a, b) => b.evals - a.evals || a.policy.localeCompare(b.policy));
  const policyByName = Object.fromEntries(policyList.map((policy) => [policy.policy, policy]));
  const evaluatorOrganizationList = [...evaluatorOrganizations.values()]
    .map(finalizeContributorStats)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const evaluatorAccountList = [...evaluatorAccounts.values()]
    .map(finalizeContributorStats)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const pairList = [...pairs.values()]
    .map(finalizePairStats)
    .sort((a, b) => b.count - a.count || a.policy1.localeCompare(b.policy1));
  const requestStats = normalizeRequestStats(requestStatsPayload);
  const knownOrgLabels = new Set(evaluatorOrganizationList.map((org) => org.label));
  const requestOnlyOrgs = Object.values(requestStats.byOrg)
    .filter((org) => !knownOrgLabels.has(org.label))
    .map((org) => ({
      label: org.label,
      count: 0,
      policyCount: 0,
      pairCount: 0,
      evaluatorCount: 0,
      tieRate: 0,
      policies: [],
      pairs: [],
      recentActivity: [],
      recentEvaluations: [],
      firstEvalAt: null,
      lastEvalAt: null,
    }));
  const orgsWithAuditStats = [...evaluatorOrganizationList, ...requestOnlyOrgs]
    .map((org) => ({
      ...org,
      requestStats: requestStats.byOrg[org.label] || null,
    }))
    .sort((a, b) => {
      const aRequested = a.requestStats?.requested || 0;
      const bRequested = b.requestStats?.requested || 0;
      return b.count - a.count || bRequested - aRequested || a.label.localeCompare(b.label);
    });

  return {
    generatedAt: new Date().toISOString(),
    totalEvals,
    tieCount,
    tieRate: roundPercent(percent(tieCount, totalEvals)),
    policyCount: policyList.length,
    pairCount: pairs.size,
    evaluatorOrganizationCount: evaluatorOrganizations.size,
    evaluatorAccountCount: evaluatorAccounts.size,
    firstEvalAt: isoOrNull(firstTimeMs),
    lastEvalAt: isoOrNull(lastTimeMs),
    recentActivity: recentMonthBuckets(globalMonths, lastTimeMs),
    integritySignals: buildIntegritySignals({
      totalEvals,
      policies: policyList,
      evaluatorOrganizations: orgsWithAuditStats,
      pairs: pairList,
      requestStats,
    }),
    requestStats,
    policies: policyList,
    policyByName,
    evaluatorOrganizations: orgsWithAuditStats,
    evaluatorAccounts: evaluatorAccountList,
    pairs: pairList,
  };
}

export function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
