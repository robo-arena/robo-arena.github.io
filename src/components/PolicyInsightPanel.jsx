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

function OutcomeBar({ stats }) {
  const segments = [
    { label: 'Wins', count: stats.wins, className: 'outcome-win' },
    { label: 'Ties', count: stats.ties, className: 'outcome-tie' },
    { label: 'Losses', count: stats.losses, className: 'outcome-loss' },
  ];

  return (
    <>
      <div className="transparency-outcome-bar" aria-label="Outcome mix">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={segment.className}
            style={{ width: `${stats.evals ? (segment.count / stats.evals) * 100 : 0}%` }}
            title={`${segment.label}: ${segment.count}`}
          />
        ))}
      </div>
      <div className="transparency-outcome-legend">
        {segments.map((segment) => (
          <span key={segment.label}>
            <i className={segment.className} />
            {segment.label} {segment.count}
          </span>
        ))}
      </div>
    </>
  );
}

function LabList({ items, emptyText }) {
  if (!items || items.length === 0) {
    return <p className="transparency-empty">{emptyText}</p>;
  }

  return (
    <div className="transparency-bar-list">
      {items.map((item) => (
        <div className="transparency-bar-row" key={item.label}>
          <div className="transparency-bar-label">
            <span>{item.label}</span>
            <strong>{formatPercent(item.winRate)}</strong>
          </div>
          <div className="transparency-bar-track">
            <span style={{ width: `${Math.max(3, item.percent)}%` }} />
          </div>
          <small className="transparency-row-meta">
            {item.count} eval{item.count === 1 ? '' : 's'}, {item.wins}-{item.ties}-{item.losses}
          </small>
        </div>
      ))}
    </div>
  );
}

function OpponentList({ opponents }) {
  const topOpponents = (opponents || []).slice(0, 4);
  if (topOpponents.length === 0) {
    return <p className="transparency-empty">No opponent coverage yet.</p>;
  }

  return (
    <div className="transparency-opponent-list">
      {topOpponents.map((opponent) => (
        <div className="transparency-opponent-row" key={opponent.policy}>
          <div>
            <span title={opponent.policy}>{opponent.policy}</span>
            <small>{opponent.count} eval{opponent.count === 1 ? '' : 's'}</small>
          </div>
          <strong>
            {opponent.wins}-{opponent.ties}-{opponent.losses}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ActivityBars({ buckets }) {
  if (!buckets || buckets.length === 0) {
    return <p className="transparency-empty">No timing data available.</p>;
  }

  return (
    <div className="transparency-activity">
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

export default function PolicyInsightPanel({ policyStats, row }) {
  if (!policyStats) {
    return (
      <div className="policy-insight-box policy-insight-box-loading">
        Transparency statistics are loading from counted public A/B evals.
      </div>
    );
  }

  const topLab = policyStats.labs[0];

  return (
    <div className="policy-insight-box">
      <div className="policy-insight-header">
        <div>
          <strong>{policyStats.policy}</strong>
        </div>
        <div className="policy-insight-score">
          <span>Score {row?.score ?? 'n/a'}</span>
          <span>{policyStats.evals.toLocaleString()} A/B evals</span>
        </div>
      </div>

      <div className="policy-insight-track" tabIndex={0} aria-label="Policy transparency statistics">
        <section className="policy-insight-card">
          <h3>Outcome Mix</h3>
          <div className="policy-insight-big-number">
            {formatPercent(policyStats.winRate)}
            <span>non-tie win rate</span>
          </div>
          <OutcomeBar stats={policyStats} />
        </section>

        <section className="policy-insight-card">
          <h3>Evaluator Coverage</h3>
          <div className="policy-insight-single-metric">
            <strong>{policyStats.labCount}</strong>
            <span>evaluator org{policyStats.labCount === 1 ? '' : 's'}</span>
          </div>
          {topLab && (
            <p className="policy-insight-note">
              Top org share: {formatPercent(policyStats.topLabShare)}
            </p>
          )}
          <LabList items={policyStats.labs.slice(0, 4)} emptyText="No evaluator organizations yet." />
        </section>

        <section className="policy-insight-card">
          <h3>Common Opponents</h3>
          <p className="policy-insight-note">Record is shown as wins-ties-losses.</p>
          <OpponentList opponents={policyStats.opponents} />
        </section>

        <section className="policy-insight-card">
          <h3>Timing</h3>
          <div className="policy-insight-date-grid">
            <span>
              First eval
              <strong>{formatDate(policyStats.firstEvalAt)}</strong>
            </span>
            <span>
              Latest eval
              <strong>{formatDate(policyStats.lastEvalAt)}</strong>
            </span>
          </div>
          <ActivityBars buckets={policyStats.recentActivity} />
        </section>
      </div>
    </div>
  );
}
