import { useEffect, useMemo, useState } from 'react';
import { HiChevronDown, HiChevronUp, HiOutlineDownload } from 'react-icons/hi';
import { apiGetJson } from '../api';
import { downloadJson } from '../utils/transparencyStats';
import './transparency.css';

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatDate(value) {
  if (!value) return 'n/a';
  return DATE_FORMAT.format(new Date(value));
}

function formatScoreDelta(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  if (value === 0) return '0 Elo';
  return `${value > 0 ? '+' : ''}${value} Elo`;
}

function DownloadButton({ children, onClick }) {
  return (
    <button type="button" className="transparency-download-btn" onClick={onClick}>
      <HiOutlineDownload aria-hidden="true" />
      {children}
    </button>
  );
}

function IntegritySignalCard({ label, value, detail, explanation, title }) {
  return (
    <article
      className="integrity-signal-card"
      tabIndex={0}
      title={title || explanation || detail}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      <p>{explanation}</p>
    </article>
  );
}

function IntegritySignals({ signals }) {
  if (!signals) return null;

  const topOrg = signals.largestOrgShare;
  const policyShare = signals.highestPolicyOrgShare;
  const thinCoverage = signals.thinOfficialCoverage;
  const pairConcentration = signals.pairConcentration;

  const cards = [
    topOrg && {
      key: 'top-org',
      label: 'Evaluator Concentration',
      value: formatPercent(topOrg.percent),
      detail: `${topOrg.evaluatorOrg} · ${topOrg.evals.toLocaleString()} evals`,
      explanation:
        'Shows how much of the benchmark evidence came from the single most active evaluator org.',
      title: 'Largest share of A/B evaluations from one evaluator organization.',
    },
    policyShare && {
      key: 'policy-share',
      label: 'Single-Org Dependence',
      value: formatPercent(policyShare.percent),
      detail: `${policyShare.policy} from ${policyShare.evaluatorOrg}`,
      explanation:
        'For each official policy, we compute the share of its A/B evals from each evaluator org; this shows the largest such share.',
      title: 'Largest share of one official policy\'s A/B evals from a single evaluator organization.',
    },
    thinCoverage && {
      key: 'thin-coverage',
      label: 'Limited Coverage',
      value: thinCoverage.count.toLocaleString(),
      detail: `official policies with fewer than 3 evaluator orgs`,
      explanation:
        'Counts official policies whose 100+ A/B evals come from fewer than three evaluator orgs.',
      title: 'Official policies with 100+ A/B evals but fewer than 3 contributing evaluator organizations.',
    },
    pairConcentration && {
      key: 'pair-concentration',
      label: 'Pair Concentration',
      value: formatPercent(pairConcentration.percent),
      detail: `${pairConcentration.policy1} vs ${pairConcentration.policy2} · ${pairConcentration.evals.toLocaleString()} evals`,
      explanation:
        'Shows whether many A/B evals are concentrated on one policy matchup instead of being spread across comparisons.',
      title: 'Largest share of A/B evaluations from a single policy pair.',
    },
  ].filter(Boolean);

  if (!cards.length) return null;

  return (
    <div className="integrity-signal-strip">
      <div className="integrity-signal-header">
        <div>
          <h4>Review Signals</h4>
        </div>
      </div>
      <div className="integrity-signal-row" tabIndex={0} aria-label="Integrity signals">
        {cards.map(({ key, ...card }) => (
          <IntegritySignalCard key={key} {...card} />
        ))}
      </div>
    </div>
  );
}

function LeaderboardMiniList({ rows, emptyText }) {
  if (!rows?.length) return <p className="transparency-empty">{emptyText}</p>;

  return (
    <div className="transparency-mini-leaderboard">
      {rows.slice(0, 6).map((row) => (
        <div className="transparency-mini-rank-row" key={`${row.rank}-${row.policy}`}>
          <span title={row.policy}>#{row.rank} {row.policy}</span>
          <strong>{row.score}</strong>
        </div>
      ))}
    </div>
  );
}

function RankChangeList({ changes }) {
  if (!changes?.length) return <p className="transparency-empty">No official-policy rank changes.</p>;

  return (
    <div className="transparency-rank-change-list">
      {changes.slice(0, 6).map((change) => (
        <div className="transparency-rank-change-row" key={change.policy}>
          <span title={change.policy}>{change.policy}</span>
          <small>
            #{change.baseRank} to {change.withoutRank ? `#${change.withoutRank}` : 'out'} ·{' '}
            {formatScoreDelta(change.scoreDelta)}
          </small>
        </div>
      ))}
    </div>
  );
}

function LeaderboardImpact({ impact, orgLabel, isLoading }) {
  if (isLoading) {
    return <p className="transparency-empty">Computing official rerun for this evaluator org.</p>;
  }

  if (impact?.status === 'warming') {
    return (
      <p className="transparency-empty">
        Official rerun cache is warming. This uses the same Bradley-Terry Davidson
        ranking path as the leaderboard and will appear shortly.
      </p>
    );
  }

  if (!impact) {
    return <p className="transparency-empty">No leave-one-org ranking rerun available.</p>;
  }

  return (
    <div className="transparency-leaderboard-impact">
      <p>
        Official Bradley-Terry Davidson leaderboard rerun with <strong>{orgLabel}</strong> removed.
      </p>
      <div className="transparency-leaderboard-impact-grid">
        <div>
          <h6>Current</h6>
          <LeaderboardMiniList rows={impact.baseline} emptyText="No baseline rows." />
        </div>
        <div>
          <h6>Without Org</h6>
          <LeaderboardMiniList rows={impact.withoutOrg} emptyText="No rerun rows." />
        </div>
        <div>
          <h6>Largest Moves</h6>
          <RankChangeList changes={impact.topChanges} />
        </div>
      </div>
    </div>
  );
}

function CompactBarList({ items, labelKey, valueKey, valueLabel, emptyText }) {
  const maxValue = Math.max(1, ...items.map((item) => Number(item[valueKey]) || 0));

  if (!items.length) {
    return <p className="transparency-empty">{emptyText}</p>;
  }

  return (
    <div className="transparency-compact-bars">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const label = item[labelKey];
        return (
          <div className="transparency-bar-row" key={label}>
            <div className="transparency-bar-label">
              <span title={label}>{label}</span>
              <strong>{value.toLocaleString()}</strong>
            </div>
            <div className="transparency-bar-track">
              <span style={{ width: `${Math.max(3, (value / maxValue) * 100)}%` }} />
            </div>
            <small className="transparency-row-meta">{valueLabel(item)}</small>
          </div>
        );
      })}
    </div>
  );
}

function PairList({ pairs }) {
  if (!pairs.length) return <p className="transparency-empty">No policy pairs yet.</p>;

  return (
    <div className="transparency-org-pair-list">
      {pairs.map((pair) => {
        const label = `${pair.policy1} vs ${pair.policy2}`;
        return (
          <div className="transparency-pair-row" key={label}>
            <div>
              <span title={label}>{label}</span>
              <small>tie rate {formatPercent(pair.tieRate)}</small>
            </div>
            <strong>{pair.count}</strong>
          </div>
        );
      })}
    </div>
  );
}

function RecentEvalList({ evaluations }) {
  if (!evaluations.length) return <p className="transparency-empty">No recent evals yet.</p>;

  return (
    <div className="transparency-recent-evals">
      {evaluations.map((evaluation) => {
        const label = `${evaluation.policyA} vs ${evaluation.policyB}`;
        const href = evaluation.sessionId ? `/results?q=sid:${evaluation.sessionId}` : '/results';
        return (
          <a className="transparency-recent-eval" href={href} key={evaluation.sessionId || label}>
            <span title={label}>{label}</span>
            <small>
              {formatDate(evaluation.completionTime)} · pref {evaluation.preference}
            </small>
          </a>
        );
      })}
    </div>
  );
}

function ActivityBars({ buckets }) {
  if (!buckets.length) return <p className="transparency-empty">No timing data yet.</p>;

  return (
    <div className="transparency-org-activity">
      {buckets.map((bucket) => (
        <div className="transparency-activity-bar" key={bucket.key}>
          <span
            style={{ height: `${Math.max(8, bucket.percent)}%` }}
            title={`${bucket.label}: ${bucket.count} evals`}
          />
          <small>{bucket.label}</small>
        </div>
      ))}
    </div>
  );
}

function EvaluatorOrgDetails({ org, rankImpact, isRankImpactLoading }) {
  const topPolicies = org.policies;
  const topPairs = org.pairs;

  return (
    <div className="evaluator-org-detail">
      <div className="evaluator-org-detail-header">
        <div>
          <h4>{org.label}</h4>
          <span>
            {org.count.toLocaleString()} A/B evals · {org.policyCount} policies · {org.pairCount} pairs
          </span>
        </div>
      </div>

      <div className="evaluator-org-detail-rail" tabIndex={0} aria-label={`Statistics for ${org.label}`}>
        <section className="evaluator-org-wide-section">
          <h5>Leave-One-Org Ranking</h5>
          <LeaderboardImpact
            impact={rankImpact}
            orgLabel={org.label}
            isLoading={isRankImpactLoading}
          />
        </section>

        <section>
          <h5>Policy Coverage</h5>
          <CompactBarList
            items={topPolicies}
            labelKey="policy"
            valueKey="count"
            valueLabel={(item) => `${formatPercent(item.percent)} of org evals`}
            emptyText="No policy coverage yet."
          />
        </section>

        <section>
          <h5>Common Pairs</h5>
          <PairList pairs={topPairs} />
        </section>

        <section>
          <h5>Recent Evals</h5>
          <RecentEvalList evaluations={org.recentEvaluations} />
        </section>

        <section>
          <h5>Activity</h5>
          <ActivityBars buckets={org.recentActivity} />
        </section>
      </div>
    </div>
  );
}

export default function TransparencyDashboard({ stats, filteredCount, query, onDownloadEvals }) {
  const [activeOrgLabel, setActiveOrgLabel] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [orgImpacts, setOrgImpacts] = useState({});
  const [loadingImpactLabel, setLoadingImpactLabel] = useState(null);
  const [impactRetryNonce, setImpactRetryNonce] = useState(0);

  const orgs = useMemo(() => stats?.evaluatorOrganizations || [], [stats]);
  const activeOrg = useMemo(
    () => orgs.find((org) => org.label === activeOrgLabel) || orgs[0],
    [activeOrgLabel, orgs]
  );

  useEffect(() => {
    if (!orgs.length) return;
    if (!activeOrgLabel || !orgs.some((org) => org.label === activeOrgLabel)) {
      setActiveOrgLabel(orgs[0].label);
    }
  }, [activeOrgLabel, orgs]);

  const activeImpact = activeOrg ? orgImpacts[activeOrg.label] : undefined;
  const activeImpactIsWarming = activeImpact?.status === 'warming';
  const hasImpactResult = activeOrg
    ? Object.prototype.hasOwnProperty.call(orgImpacts, activeOrg.label) &&
      !activeImpactIsWarming
    : false;

  useEffect(() => {
    if (!isExpanded || !activeOrg?.label || activeOrg.count === 0 || hasImpactResult) {
      return undefined;
    }

    let isCancelled = false;
    const label = activeOrg.label;
    const retryDelay = activeImpactIsWarming ? 30000 : 0;
    const timeoutId = window.setTimeout(() => {
      setLoadingImpactLabel(label);

      apiGetJson(`/evaluator_leaderboard_impact?org=${encodeURIComponent(label)}`)
        .then((data) => {
          if (!isCancelled) {
            setOrgImpacts((prev) => ({ ...prev, [label]: data }));
            if (data?.status === 'warming') {
              setImpactRetryNonce((value) => value + 1);
            }
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setOrgImpacts((prev) => ({ ...prev, [label]: null }));
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setLoadingImpactLabel((current) => (current === label ? null : current));
          }
        });
    }, retryDelay);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    activeOrg?.label,
    activeOrg?.count,
    activeImpactIsWarming,
    hasImpactResult,
    impactRetryNonce,
    isExpanded,
  ]);

  if (!stats || stats.totalEvals === 0) {
    return (
      <section className="transparency-dashboard evaluator-org-panel">
        <div className="evaluator-org-panel-header">
          <h3>Evaluator Org Statistics</h3>
          <span>Loading public A/B evaluation statistics.</span>
        </div>
      </section>
    );
  }

  const evaluatorOrganizationsForDownload = stats.evaluatorOrganizations.map((org) => {
    const cleanOrg = { ...org };
    delete cleanOrg.requestStats;
    return cleanOrg;
  });
  const summaryPayload = {
    generated_at: stats.generatedAt,
    note: 'Derived from counted public RoboArena A/B evaluations.',
    totals: {
      counted_ab_evaluations: stats.totalEvals,
      evaluator_organizations: stats.evaluatorOrganizationCount,
      evaluator_accounts: stats.evaluatorAccountCount,
      unique_policy_pairs: stats.pairCount,
      tie_rate_percent: stats.tieRate,
      first_eval_at: stats.firstEvalAt,
      last_eval_at: stats.lastEvalAt,
    },
    evaluator_organizations: evaluatorOrganizationsForDownload,
    integrity_signals: stats.integritySignals,
    policies: stats.policies,
    pairs: stats.pairs,
  };

  return (
    <section className={`transparency-dashboard evaluator-org-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="evaluator-org-panel-header">
        <div>
          <h3>Evaluator Org Statistics</h3>
          <p className="evaluator-overview-summary">
            <span>{stats.totalEvals.toLocaleString()} A/B evals</span>
            <span>{stats.evaluatorOrganizationCount.toLocaleString()} evaluator orgs</span>
            <span>{stats.pairCount.toLocaleString()} policy pairs</span>
            {query.trim() ? (
              <span>{filteredCount.toLocaleString()} shown by current search</span>
            ) : null}
          </p>
        </div>
        <div className="transparency-actions">
          <button
            type="button"
            className="transparency-expand-btn"
            onClick={() => setIsExpanded((value) => !value)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <HiChevronUp aria-hidden="true" /> : <HiChevronDown aria-hidden="true" />}
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
          <DownloadButton
            onClick={async () => {
              if (!onDownloadEvals) return;
              const payload = await onDownloadEvals();
              downloadJson('roboarena-counted-ab-evaluations.json', payload);
            }}
          >
            Evals JSON
          </DownloadButton>
          <DownloadButton
            onClick={() =>
              downloadJson('roboarena-evaluator-org-statistics.json', summaryPayload)
            }
          >
            Stats JSON
          </DownloadButton>
        </div>
      </div>

      {isExpanded && (
        <>
          <IntegritySignals signals={stats.integritySignals} />

          <div className="evaluator-org-layout">
            <div className="evaluator-org-list" aria-label="Evaluator organizations">
              {orgs.map((org) => {
                const isActive = org.label === activeOrg?.label;
                return (
                  <button
                    type="button"
                    className={`evaluator-org-item ${isActive ? 'active' : ''}`}
                    key={org.label}
                    onClick={() => setActiveOrgLabel(org.label)}
                    onFocus={() => setActiveOrgLabel(org.label)}
                    onMouseEnter={() => setActiveOrgLabel(org.label)}
                  >
                    <span title={org.label}>{org.label}</span>
                    <strong>{org.count.toLocaleString()}</strong>
                  </button>
                );
              })}
            </div>

            {activeOrg && (
              <EvaluatorOrgDetails
                org={activeOrg}
                rankImpact={activeImpact}
                isRankImpactLoading={
                  activeOrg.count > 0 &&
                  !hasImpactResult &&
                  loadingImpactLabel === activeOrg.label &&
                  !activeImpactIsWarming
                }
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}
