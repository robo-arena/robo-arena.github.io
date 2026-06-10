import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api';
import './admin.css';

function Stat({ label, value }) {
  return (
    <div className="admin-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RankedList({ title, rows }) {
  const max = Math.max(1, ...(rows || []).map((row) => row.count || 0));
  return (
    <section className="admin-panel">
      <h3>{title}</h3>
      <div className="admin-ranked-list">
        {(rows || []).map((row) => (
          <div className="admin-ranked-row" key={row.label}>
            <div>
              <span title={row.label}>{row.label}</span>
              <strong>{row.count.toLocaleString()}</strong>
            </div>
            <em style={{ width: `${Math.max(3, (row.count / max) * 100)}%` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminMetrics() {
  const [token, setToken] = useState(() => sessionStorage.getItem('roboarena_admin_token') || '');
  const [draftToken, setDraftToken] = useState(token);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const canFetch = token.trim().length > 0;

  useEffect(() => {
    if (!canFetch) return;

    apiGet(`/admin/visitation_metrics?days=${days}`, {
      headers: { 'X-RoboArena-Admin-Token': token },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text());
        }
        return response.json();
      })
      .then((data) => {
        setMetrics(data);
        setError('');
      })
      .catch(() => {
        setMetrics(null);
        setError('Could not load metrics. Check the admin token.');
      });
  }, [canFetch, days, token]);

  const dailyMax = useMemo(
    () => Math.max(1, ...(metrics?.daily || []).map((row) => row.views || 0)),
    [metrics]
  );

  const saveToken = () => {
    const cleaned = draftToken.trim();
    setToken(cleaned);
    if (cleaned) sessionStorage.setItem('roboarena_admin_token', cleaned);
    else sessionStorage.removeItem('roboarena_admin_token');
  };

  return (
    <div className="admin-metrics-wrap">
      <h2>RoboArena Metrics</h2>

      <div className="admin-auth-row">
        <input
          type="password"
          value={draftToken}
          onChange={(event) => setDraftToken(event.target.value)}
          placeholder="Admin token"
        />
        <button type="button" onClick={saveToken}>Load</button>
        <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>365 days</option>
        </select>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {metrics && (
        <>
          <div className="admin-stat-grid">
            <Stat label="Page Views" value={metrics.totals.views.toLocaleString()} />
            <Stat label="Visitors" value={metrics.totals.unique_visitors.toLocaleString()} />
            <Stat label="IP Hashes" value={metrics.totals.unique_ip_hashes.toLocaleString()} />
          </div>

          <section className="admin-panel admin-wide-panel">
            <h3>Daily Views</h3>
            <div className="admin-daily-bars">
              {(metrics.daily || []).map((row) => (
                <div className="admin-daily-bar" key={row.date}>
                  <span
                    style={{ height: `${Math.max(4, (row.views / dailyMax) * 100)}%` }}
                    title={`${row.date}: ${row.views} views`}
                  />
                  <small>{row.date.slice(5)}</small>
                </div>
              ))}
            </div>
          </section>

          <div className="admin-grid">
            <RankedList title="Pages" rows={metrics.paths} />
            <RankedList title="Countries" rows={metrics.countries} />
            <RankedList title="Referrers" rows={metrics.referrers} />
            <RankedList title="Timezones" rows={metrics.timezones} />
          </div>
        </>
      )}
    </div>
  );
}
