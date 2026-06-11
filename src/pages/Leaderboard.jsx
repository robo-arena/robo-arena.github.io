import { Fragment, useEffect, useMemo, useState } from 'react';
import '../css/theme.css';
import './leaderboard.css';          // 💡 add a page-specific stylesheet
import PolicyAnalysisReport from '../components/PolicyAnalysisReport.jsx';
import PolicyInsightPanel from '../components/PolicyInsightPanel.jsx';
import { BenchmarkIntegrityCallout } from '../components/BenchmarkIntegrityNotice.jsx';
import { apiGetJson } from '../api';
import arxivLogo from '../assets/arxiv-logo.png';
import { HiOutlineClock } from 'react-icons/hi';
import { buildTransparencyStatsFromSummary } from '../utils/transparencyStats';

const POLICY_ARXIV_LINKS = {
  DreamZero: 'https://arxiv.org/abs/2602.15922',
  pi05_droid: 'https://arxiv.org/abs/2504.16054',
  pi0_fast_droid: 'https://arxiv.org/abs/2501.09747',
  pi0_droid: 'https://arxiv.org/abs/2410.24164',
};

const MAIN_LEADERBOARD_MIN_EVALS = 100;

export default function Leaderboard() {
  const [currentBoard, setCurrentBoard] = useState([]);
  const [currentUpdated, setCurrentUpdated] = useState(null);
  const [ossOnly, setOssOnly] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState('main');
  const [transparencySummary, setTransparencySummary] = useState(null);

  useEffect(() => {
    apiGetJson('/leaderboard')
      .then((d) => {
        setCurrentBoard(d.board);
        setCurrentUpdated(d.last_updated);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    apiGetJson('/transparency_summary')
      .then((d) => setTransparencySummary(d))
      .catch(console.error);
  }, []);

  const board = currentBoard;
  const updated = currentUpdated;
  const mainRows = useMemo(
    () => board.filter((row) => (Number(row.num_evals) || 0) >= MAIN_LEADERBOARD_MIN_EVALS),
    [board]
  );
  const transparencyStats = useMemo(
    () => buildTransparencyStatsFromSummary(transparencySummary),
    [transparencySummary]
  );
  const scopedRows = leaderboardScope === 'all' ? board : mainRows;
  const visible = ossOnly ? scopedRows.filter((r) => r.open_source) : scopedRows;
  const chartRows = useMemo(
    () => [...visible].sort((a, b) => a.score - b.score),
    [visible]
  );
  const scopeNote =
    leaderboardScope === 'all'
      ? 'All policies · includes early results with higher uncertainty.'
      : `Official leaderboard · ${MAIN_LEADERBOARD_MIN_EVALS}+ A/B evals per policy for more stable rankings.`;

  return (
    <div className="leaderboard-wrap">
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        Policy Leaderboard
      </h2>

      <BenchmarkIntegrityCallout />

      {updated && (
        <p style={{ textAlign: 'center', fontSize: '0.95rem', color: '#555' }}>
          Last updated&nbsp;{new Date(updated).toLocaleString()}
        </p>
      )}

      <div className="lb-controls">
        <div
          className="lb-scope-segments"
          role="group"
          aria-label="Leaderboard policies"
        >
          <button
            type="button"
            className={`lb-scope-segment ${leaderboardScope === 'main' ? 'active' : ''}`}
            onClick={() => setLeaderboardScope('main')}
            aria-pressed={leaderboardScope === 'main'}
          >
            <span>Official</span>
          </button>
          <button
            type="button"
            className={`lb-scope-segment ${leaderboardScope === 'all' ? 'active' : ''}`}
            onClick={() => setLeaderboardScope('all')}
            aria-pressed={leaderboardScope === 'all'}
          >
            <span>All Policies</span>
          </button>
          {board.length > 0 && (
            <p className="lb-scope-summary">
              {scopeNote}
            </p>
          )}
        </div>

        <div className="lb-filter">
          <label className="lb-toggle">
            <input
              type="checkbox"
              checked={showChart}
              onChange={(e) => setShowChart(e.target.checked)}
            />{' '}
            Show chart view
          </label>
          <label className="lb-toggle">
            <input
              type="checkbox"
              checked={ossOnly}
              onChange={(e) => setOssOnly(e.target.checked)}
            />{' '}
            Show open-source policies only
          </label>
        </div>
      </div>

      {board.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading…</p>
      ) : visible.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          No policies match the selected filters.
        </p>
      ) : (
        showChart ? (
          <LeaderboardChart rows={chartRows} />
        ) : (
          <div className="lb-table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Policy</th>
                  <th className="center lb-status-col">Status</th>
                  <th className="right">Score</th>
                  <th className="right">SD</th>
                  <th className="right"># A/B&nbsp;Evals</th>
                  {/* right-aligned header  ↓ */}
                  <th className="right">Open&nbsp;Source</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, idx) => (          /* ← use filtered list */
                  <Fragment key={r.policy}>
                    <tr
                      className={`lb-data-row ${idx % 2 === 1 ? 'lb-data-row-even' : ''}`}
                      tabIndex={0}
                    >
                      <td className="left">{idx + 1}</td>
                      <td>
                        <div className="lb-policy-cell">
                          <span className="lb-policy-name">{r.policy}</span>
                          {POLICY_ARXIV_LINKS[r.policy] && (
                            <a
                              className="lb-arxiv-link"
                              href={POLICY_ARXIV_LINKS[r.policy]}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Open ${r.policy} paper on arXiv`}
                              aria-label={`Open ${r.policy} paper on arXiv`}
                            >
                              <img src={arxivLogo} alt="arXiv paper" className="lb-arxiv-icon" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="lb-status-cell">
                        <PolicyStatusIndicators row={r} />
                      </td>
                      <td className="right">{r.score}</td>
                      <td className="right">{r.std}</td>
                      <td className="right">
                        {typeof r.num_evals === 'number' ? r.num_evals.toLocaleString() : '—'}
                      </td>
                      {/* centre the ✔ without drifting left ↓ */}
                      <td className="oss-cell">{r.open_source ? '✔️' : ''}</td>
                    </tr>
                    <tr className="lb-insight-row">
                      <td colSpan={7}>
                        <PolicyInsightPanel
                          policyStats={transparencyStats?.policyByName?.[r.policy]}
                          row={r}
                        />
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <PolicyAnalysisReport />
    </div>
  );
}

function formatUptimePercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return `${rounded}%`;
}

function formatUptimeCoverageDays(status) {
  const startMs = Date.parse(status.uptime_window_started_at);
  const endMs = Date.parse(status.last_status_checked_at);
  const maxHours = status.uptime_window_hours;
  const maxDays =
    typeof maxHours === 'number' && !Number.isNaN(maxHours)
      ? Math.max(1, Math.ceil(maxHours / 24))
      : 30;
  let days = maxDays;

  if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
    const observedDays = Math.ceil(Math.max(0, endMs - startMs) / (1000 * 60 * 60 * 24));
    days = Math.min(maxDays, Math.max(1, observedDays));
  }

  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function PolicyStatusIndicators({ row }) {
  const status = row.status || {};
  const state =
    status.is_active === true
      ? 'active'
      : status.is_active === false
        ? 'inactive'
        : 'unknown';

  const statusTooltip =
    state === 'active'
      ? 'Policy server is up.'
      : state === 'inactive'
        ? 'Policy server is down.'
        : 'Policy server status appears after the next health check.';

  const uptimePercent = formatUptimePercent(status.uptime_percent);
  const uptimeTooltip = uptimePercent
    ? `Uptime fraction: ${uptimePercent} over the past ${formatUptimeCoverageDays(status)}.`
    : 'Policy server uptime appears after the next health check.';

  return (
    <span className="lb-status-group" aria-label={`Policy status for ${row.policy}`}>
      <span
        className={`lb-active-dot lb-active-dot-${state}`}
        data-tooltip={statusTooltip}
        role="img"
        tabIndex={0}
        aria-label={statusTooltip}
      />
      <span
        className="lb-uptime-trigger"
        data-tooltip={uptimeTooltip}
        role="img"
        tabIndex={0}
        aria-label={uptimeTooltip}
      >
        <HiOutlineClock aria-hidden="true" />
      </span>
    </span>
  );
}

function LeaderboardChart({ rows }) {
  const [tooltip, setTooltip] = useState(null);

  const width = 1000;
  const height = 520;
  const margin = { top: 26, right: 30, bottom: 14, left: 72 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const stats = rows.reduce(
    (acc, row) => {
      const sd = Number(row.std) || 0;
      const low = Number(row.score) - sd;
      const high = Number(row.score) + sd;
      return {
        min: Math.min(acc.min, low),
        max: Math.max(acc.max, high),
      };
    },
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
  );
  const span = Number.isFinite(stats.max - stats.min) ? stats.max - stats.min : 0;
  const yPad = Math.max(16, span * 0.08);
  const yMin = Number.isFinite(stats.min) ? stats.min - yPad : 0;
  const yMax = Number.isFinite(stats.max) ? stats.max + yPad : 1;
  const yDenom = Math.max(1e-9, yMax - yMin);

  const xScale = (idx) =>
    rows.length <= 1
      ? margin.left + plotWidth / 2
      : margin.left + (idx / (rows.length - 1)) * plotWidth;
  const yScale = (value) => margin.top + ((yMax - value) / yDenom) * plotHeight;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const xStep = rows.length <= 1 ? plotWidth : plotWidth / (rows.length - 1);
  const labelDx = xStep < 78 ? 8 : 10;
  const labelFontPx = 10.5;
  const charWidthFactor = 0.58;
  const labelPadPx = 4;

  const points = rows.map((row, idx) => {
    const x = xScale(idx);
    const y = yScale(Number(row.score));
    const sd = Number(row.std) || 0;
    return {
      ...row,
      idx,
      x,
      y,
      yLow: yScale(Number(row.score) - sd),
      yHigh: yScale(Number(row.score) + sd),
    };
  });

  const linePath = points
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - margin.bottom} L ${points[0].x} ${height - margin.bottom} Z`
    : '';

  const tickCount = 6;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + (i / tickCount) * (yMax - yMin));

  const showTooltip = (point) => {
    setTooltip({
      point,
      xPct: (point.x / width) * 100,
      yPct: (point.y / height) * 100,
    });
  };

  return (
    <div className="lb-chart-panel" onMouseLeave={() => setTooltip(null)}>
      <div className="lb-chart-scroll">
        <svg
          className="lb-chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto' }}
          role="img"
          aria-label="Leaderboard chart with Elo score and standard deviation error bars"
        >
          <defs>
            <linearGradient id="lb-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59749" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f59749" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, idx) => {
            const y = yScale(tick);
            return (
              <g key={`grid-${idx}`}>
                <line
                  className="lb-grid-line"
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                />
                <text
                  className="lb-ytick-label"
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                >
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

          <line
            className="lb-axis-line"
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
          />
          <line
            className="lb-axis-line"
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
          />

          <text
            className="lb-axis-title"
            x={24}
            y={height / 2}
            transform={`rotate(-90 24 ${height / 2})`}
            textAnchor="middle"
          >
            Elo
          </text>

          {areaPath && <path d={areaPath} className="lb-line-area" />}
          {linePath && <path d={linePath} className="lb-line-path" />}

          {points.map((point) => {
            const labelX = point.idx === 0 ? point.x + labelDx : point.x - labelDx;
            const estLabelLength = Math.max(
              18,
              (point.policy?.length ?? 0) * labelFontPx * charWidthFactor
            );
            const halfLabelSpan = estLabelLength / 2 + labelPadPx;
            const minLabelY = margin.top + halfLabelSpan;
            const maxLabelY = height - margin.bottom - halfLabelSpan;
            const labelY = minLabelY <= maxLabelY
              ? clamp(point.y, minLabelY, maxLabelY)
              : margin.top + plotHeight / 2;
            return (
              <g key={point.policy}>
                <line
                  className="lb-error-bar"
                  x1={point.x}
                  y1={point.yLow}
                  x2={point.x}
                  y2={point.yHigh}
                />
                <line
                  className="lb-error-cap"
                  x1={point.x - 5}
                  y1={point.yLow}
                  x2={point.x + 5}
                  y2={point.yLow}
                />
                <line
                  className="lb-error-cap"
                  x1={point.x - 5}
                  y1={point.yHigh}
                  x2={point.x + 5}
                  y2={point.yHigh}
                />
                <circle
                  className="lb-point"
                  cx={point.x}
                  cy={point.y}
                  r={5.25}
                  onMouseEnter={() => showTooltip(point)}
                />
                <text
                  className="lb-point-label"
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(-90 ${labelX} ${labelY})`}
                >
                  {point.policy}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {tooltip && (
        <div
          className="lb-chart-tooltip"
          style={{ left: `${tooltip.xPct}%`, top: `${tooltip.yPct}%` }}
        >
          <div className="lb-tooltip-title">{tooltip.point.policy}</div>
          <div className="lb-tooltip-row">
            <span>Elo</span>
            <strong>{tooltip.point.score}</strong>
          </div>
          <div className="lb-tooltip-row">
            <span>Std</span>
            <strong>{tooltip.point.std}</strong>
          </div>
          <div className="lb-tooltip-row">
            <span># A/B Evals</span>
            <strong>{tooltip.point.num_evals ?? '—'}</strong>
          </div>
          <div className="lb-tooltip-row">
            <span>Open Source</span>
            <strong>{tooltip.point.open_source ? 'Yes' : 'No'}</strong>
          </div>
        </div>
      )}

    </div>
  );
}
