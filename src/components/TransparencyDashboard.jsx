import { HiOutlineDownload } from 'react-icons/hi';
import { downloadJson, isRankingIncludedEvaluation } from '../utils/transparencyStats';
import './transparency.css';

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function maxCount(items, key) {
  return Math.max(1, ...items.map((item) => Number(item[key]) || 0));
}

function DownloadButton({ children, onClick }) {
  return (
    <button type="button" className="transparency-download-btn" onClick={onClick}>
      <HiOutlineDownload aria-hidden="true" />
      {children}
    </button>
  );
}

function RankedBarList({ items, maxValue, getLabel, getMeta, getValue }) {
  return (
    <div className="transparency-bar-list">
      {items.map((item) => {
        const value = getValue(item);
        const width = Math.max(3, (value / maxValue) * 100);
        return (
          <div className="transparency-bar-row" key={getLabel(item)}>
            <div className="transparency-bar-label">
              <span>{getLabel(item)}</span>
              <strong>{value.toLocaleString()}</strong>
            </div>
            <div className="transparency-bar-track" title={getMeta(item)}>
              <span style={{ width: `${width}%` }} />
            </div>
            <small className="transparency-row-meta">{getMeta(item)}</small>
          </div>
        );
      })}
    </div>
  );
}

function PairList({ pairs }) {
  return (
    <div className="transparency-pair-list">
      {pairs.map((pair) => (
        <div className="transparency-pair-row" key={`${pair.policy1}-${pair.policy2}`}>
          <div>
            <span>
              {pair.policy1} vs {pair.policy2}
            </span>
            <small>
              {pair.labCount} org{pair.labCount === 1 ? '' : 's'} / tie rate {formatPercent(pair.tieRate)}
            </small>
          </div>
          <strong>{pair.count}</strong>
        </div>
      ))}
    </div>
  );
}

export default function TransparencyDashboard({ evaluations, stats, filteredCount, query }) {
  if (!stats || stats.totalEvals === 0) {
    return (
      <section className="transparency-dashboard">
        <div className="transparency-dashboard-header">
          <div>
            <h3>Benchmark Transparency</h3>
            <p>Loading counted public A/B evaluation statistics.</p>
          </div>
        </div>
      </section>
    );
  }

  const topOrganizations = stats.evaluatorOrganizations.slice(0, 4);
  const topPolicies = stats.policies.slice(0, 4);
  const topPairs = stats.pairs.slice(0, 4);
  const countedEvaluations = evaluations.filter(isRankingIncludedEvaluation);
  const orgMax = maxCount(topOrganizations, 'count');
  const policyMax = maxCount(topPolicies, 'evals');
  const summaryPayload = {
    generated_at: stats.generatedAt,
    note: 'Derived from counted public RoboArena A/B evaluations.',
    totals: {
      counted_ab_evaluations: stats.totalEvals,
      policies: stats.policyCount,
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
    <section className="transparency-dashboard">
      <div className="transparency-dashboard-header">
        <div>
          <h3>Benchmark Transparency</h3>
          <p>
            Counted A/B eval coverage, evaluator contribution, and matchup concentration.
            {query.trim()
              ? ` Current search shows ${filteredCount.toLocaleString()} of ${stats.totalEvals.toLocaleString()} evals.`
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
            Counted Evals
          </DownloadButton>
          <DownloadButton
            onClick={() =>
              downloadJson('roboarena-transparency-summary.json', summaryPayload)
            }
          >
            Summary
          </DownloadButton>
        </div>
      </div>

      <div className="transparency-kpis">
        <div className="transparency-kpi">
          <strong>{stats.totalEvals.toLocaleString()}</strong>
          <span>counted A/B evals</span>
        </div>
        <div className="transparency-kpi">
          <strong>{stats.policyCount.toLocaleString()}</strong>
          <span>policies evaluated</span>
        </div>
        <div className="transparency-kpi">
          <strong>{stats.evaluatorOrganizationCount.toLocaleString()}</strong>
          <span>evaluator orgs</span>
        </div>
        <div className="transparency-kpi">
          <strong>{stats.pairCount.toLocaleString()}</strong>
          <span>unique policy pairs</span>
        </div>
      </div>

      <div className="transparency-grid">
        <section className="transparency-section transparency-section-wide">
          <h3>Evaluator Organizations</h3>
          <p className="transparency-note">
            High concentration here can reveal whether a score depends heavily on one lab.
          </p>
          <RankedBarList
            items={topOrganizations}
            maxValue={orgMax}
            getLabel={(item) => item.label}
            getValue={(item) => item.count}
            getMeta={(item) =>
              `${item.policyCount} policies / ${item.pairCount} pairs / ${formatPercent(item.tieRate)} ties`
            }
          />
        </section>

        <section className="transparency-section transparency-section-wide">
          <h3>Policy Coverage</h3>
          <p className="transparency-note">
            Broad evaluator and opponent coverage makes a ranking easier to trust.
          </p>
          <RankedBarList
            items={topPolicies}
            maxValue={policyMax}
            getLabel={(item) => item.policy}
            getValue={(item) => item.evals}
            getMeta={(item) =>
              `${item.labCount} orgs / ${item.opponentCount} opponents / ${formatPercent(item.winRate)} win rate`
            }
          />
        </section>

        <section className="transparency-section">
          <h3>High-Volume Matchups</h3>
          <p className="transparency-note">
            Repeated pairs are useful, but too much pair concentration can hide weak coverage.
          </p>
          <PairList pairs={topPairs} />
        </section>

        <section className="transparency-section">
          <h3>Recent Activity</h3>
          <p className="transparency-note">
            Counted public evals by completion month.
          </p>
          <div className="transparency-activity">
            {stats.recentActivity.map((bucket) => (
              <div className="transparency-activity-bar" key={bucket.key}>
                <span
                  style={{ height: `${Math.max(8, bucket.percent)}%` }}
                  title={`${bucket.label}: ${bucket.count} evals`}
                />
                <small>{bucket.label}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
