import { useEffect, useMemo, useState } from 'react';
import { HiOutlineDownload } from 'react-icons/hi';
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

function DownloadButton({ children, onClick }) {
  return (
    <button type="button" className="transparency-download-btn" onClick={onClick}>
      <HiOutlineDownload aria-hidden="true" />
      {children}
    </button>
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
  const topPolicies = org.policies.slice(0, 6);
  const topPairs = org.pairs.slice(0, 6);

  return (
    <div className="evaluator-org-detail">
      <div className="evaluator-org-detail-header">
        <div>
          <h4>{org.label}</h4>
          <span>
            {org.count.toLocaleString()} evals · {org.policyCount} policies · {org.pairCount} pairs
          </span>
        </div>
        <strong>{formatPercent(org.tieRate)} ties</strong>
      </div>

      <div className="evaluator-org-detail-rail" tabIndex={0} aria-label={`Statistics for ${org.label}`}>
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
    policies: stats.policies,
    pairs: stats.pairs,
  };

  return (
    <section className="transparency-dashboard evaluator-org-panel">
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

        {activeOrg && <EvaluatorOrgDetails org={activeOrg} />}
      </div>
    </section>
  );
}
