import { useEffect, useMemo, useState } from 'react';
import { HiChevronDown, HiChevronUp, HiOutlineDownload } from 'react-icons/hi';
import { downloadJson, isRankingIncludedEvaluation } from '../utils/transparencyStats';
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

function formatRankMove(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  const abs = Math.abs(value);
  return `${abs} rank${abs === 1 ? '' : 's'}`;
}

function toneFromValue(value, watchAt, reviewAt) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'neutral';
  if (value >= reviewAt) return 'review';
  if (value >= watchAt) return 'watch';
  return 'neutral';
}

function DownloadButton({ children, onClick }) {
  return (
    <button type="button" className="transparency-download-btn" onClick={onClick}>
      <HiOutlineDownload aria-hidden="true" />
      {children}
    </button>
  );
}

function IntegritySignalCard({ label, value, detail, explanation, tone = 'neutral', title }) {
  return (
    <article
      className={`integrity-signal-card ${tone}`}
      tabIndex={0}
      title={title || explanation || detail}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function IntegritySignals({ signals }) {
  if (!signals) return null;

  const topOrg = signals.largestOrgShare;
  const policyShare = signals.highestPolicyOrgShare;
  const rankShift = signals.largestLeaveOneOrgRankShift;
  const rejection = signals.largestRejection;
  const thinCoverage = signals.thinOfficialCoverage;
  const pairConcentration = signals.pairConcentration;

  const cards = [
    rejection && {
      key: 'request-dropoff',
      label: 'Request Drop-Off',
      value: formatPercent(rejection.rejection_rate),
      detail: `${rejection.label} · ${rejection.performed.toLocaleString()}/${rejection.requested.toLocaleString()} performed`,
      explanation:
        'Requested evals are assigned A/B sessions. Performed evals submitted a terminal preference. High drop-off can indicate discarded or abandoned assignments.',
      tone: toneFromValue(rejection.rejection_rate, 50, 80),
      title: `Largest request-to-performed drop-off among evaluator orgs with at least ${signals.minimumRequestedForDropoffSignal} requested evals.`,
    },
    rankShift && {
      key: 'rank-shift',
      label: 'Rank Sensitivity',
      value: formatRankMove(rankShift.rankDelta),
      detail: `${rankShift.policy}: #${rankShift.baseRank} to ${
        rankShift.withoutRank ? `#${rankShift.withoutRank}` : 'out'
      }`,
      explanation:
        'Reruns the public counted A/B ranking after removing one evaluator org. This shows the largest official-policy rank movement.',
      tone: toneFromValue(Math.abs(rankShift.rankDelta || 0), 1, 2),
      title: `Largest leave-one-evaluator-org-out rank movement (${rankShift.evaluatorOrg}).`,
    },
    topOrg && {
      key: 'top-org',
      label: 'Top Org Share',
      value: formatPercent(topOrg.percent),
      detail: `${topOrg.evaluatorOrg} · ${topOrg.evals.toLocaleString()} evals`,
      explanation:
        'Largest share of counted public A/B evaluations from one evaluator organization.',
      tone: toneFromValue(topOrg.percent, 25, 40),
      title: 'Largest share of counted A/B evaluations from one evaluator organization.',
    },
    policyShare && {
      key: 'policy-share',
      label: 'Policy Dependence',
      value: formatPercent(policyShare.percent),
      detail: `${policyShare.policy} from ${policyShare.evaluatorOrg}`,
      explanation:
        'For official policies, this is the largest share of a policy score coming from one evaluator org.',
      tone: toneFromValue(policyShare.percent, 55, 70),
      title: 'Largest share of one official policy\'s evidence from a single evaluator organization.',
    },
    thinCoverage && {
      key: 'thin-coverage',
      label: 'Thin Coverage',
      value: thinCoverage.count.toLocaleString(),
      detail: `official policies with fewer than 3 evaluator orgs`,
      explanation:
        'Counts official policies with 100+ A/B evals but fewer than three evaluator organizations contributing evidence.',
      tone: thinCoverage.count > 2 ? 'review' : thinCoverage.count > 0 ? 'watch' : 'neutral',
      title: 'Official policies with 100+ A/B evals but fewer than 3 contributing evaluator organizations.',
    },
    pairConcentration && {
      key: 'pair-concentration',
      label: 'Top Pair Share',
      value: formatPercent(pairConcentration.percent),
      detail: `${pairConcentration.policy1} vs ${pairConcentration.policy2} · ${pairConcentration.evals.toLocaleString()} evals`,
      explanation:
        'Largest fraction of counted A/B evaluations spent on one policy pair. High concentration can make rankings easier to steer.',
      tone: toneFromValue(pairConcentration.percent, 12, 20),
      title: 'Largest share of counted A/B evaluations from a single policy pair.',
    },
  ].filter(Boolean);

  if (!cards.length) return null;

  return (
    <div className="integrity-signal-strip">
      <div className="integrity-signal-row" tabIndex={0} aria-label="Integrity signals">
        {cards.map(({ key, ...card }) => (
          <IntegritySignalCard key={key} {...card} />
        ))}
      </div>
    </div>
  );
}

function RequestFunnel({ stats }) {
  if (!stats) {
    return <p className="transparency-empty">Request stats unavailable until the server exposes aggregate session counts.</p>;
  }

  return (
    <div className="transparency-mini-stats">
      <span>
        <strong>{stats.requested.toLocaleString()}</strong>
        Requested
      </span>
      <span>
        <strong>{stats.performed.toLocaleString()}</strong>
        Performed
      </span>
      <span>
        <strong>{formatPercent(stats.rejection_rate)}</strong>
        Drop-off
      </span>
      <span>
        <strong>{stats.counted.toLocaleString()}</strong>
        Valid
      </span>
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

function LeaderboardImpact({ impact, orgLabel }) {
  if (!impact) {
    return <p className="transparency-empty">No leave-one-org ranking rerun available.</p>;
  }

  return (
    <div className="transparency-leaderboard-impact">
      <p>
        Public counted A/B ranking rerun with <strong>{orgLabel}</strong> removed.
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

function EvaluatorOrgDetails({ org }) {
  const topPolicies = org.policies;
  const topPairs = org.pairs;
  const requestStats = org.requestStats;
  const rankImpact = org.rankingImpact;

  return (
    <div className="evaluator-org-detail">
      <div className="evaluator-org-detail-header">
        <div>
          <h4>{org.label}</h4>
          <span>
            {org.count.toLocaleString()} counted evals · {org.policyCount} policies · {org.pairCount} pairs
          </span>
        </div>
        <strong>
          {requestStats
            ? `${formatPercent(requestStats.rejection_rate)} drop-off`
            : `${formatPercent(org.tieRate)} ties`}
        </strong>
      </div>

      <div className="evaluator-org-detail-rail" tabIndex={0} aria-label={`Statistics for ${org.label}`}>
        <section>
          <h5>Request Funnel</h5>
          <RequestFunnel stats={requestStats} />
        </section>

        <section className="evaluator-org-wide-section">
          <h5>Leave-One-Org Ranking</h5>
          <LeaderboardImpact impact={rankImpact} orgLabel={org.label} />
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

export default function TransparencyDashboard({ evaluations, stats, filteredCount, query }) {
  const [activeOrgLabel, setActiveOrgLabel] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

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

  if (!stats || stats.totalEvals === 0) {
    return (
      <section className="transparency-dashboard evaluator-org-panel">
        <div className="evaluator-org-panel-header">
          <h3>Evaluator Org Statistics</h3>
          <span>Loading counted public A/B evaluation statistics.</span>
        </div>
      </section>
    );
  }

  const countedEvaluations = evaluations.filter(isRankingIncludedEvaluation);
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
    evaluator_organizations: stats.evaluatorOrganizations,
    integrity_signals: stats.integritySignals,
    request_stats: stats.requestStats,
    ranking_impacts: stats.rankingImpacts,
    policies: stats.policies,
    pairs: stats.pairs,
  };

  return (
    <section className={`transparency-dashboard evaluator-org-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="evaluator-org-panel-header">
        <div>
          <h3>Evaluator Org Statistics</h3>
          <p>
            {stats.totalEvals.toLocaleString()} counted A/B evals ·{' '}
            {stats.evaluatorOrganizationCount.toLocaleString()} evaluator orgs ·{' '}
            {stats.pairCount.toLocaleString()} policy pairs
            {query.trim()
              ? ` · ${filteredCount.toLocaleString()} shown by current search`
              : ''}
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
            onClick={() =>
              downloadJson('roboarena-counted-ab-evaluations.json', {
                generated_at: new Date().toISOString(),
                count: countedEvaluations.length,
                evaluations: countedEvaluations,
              })
            }
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

      <IntegritySignals signals={stats.integritySignals} />

      {isExpanded && (
        <div className="evaluator-org-layout">
          <div className="evaluator-org-list" aria-label="Evaluator organizations">
            {orgs.map((org) => {
              const isActive = org.label === activeOrg?.label;
              const countLabel = org.requestStats?.requested ?? org.count;
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
                  <strong>{countLabel.toLocaleString()}</strong>
                </button>
              );
            })}
          </div>

          {activeOrg && <EvaluatorOrgDetails org={activeOrg} />}
        </div>
      )}
    </section>
  );
}
