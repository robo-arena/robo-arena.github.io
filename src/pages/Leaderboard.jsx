import { useEffect, useState } from 'react';
import '../css/theme.css';
import './leaderboard.css';          // 💡 add a page-specific stylesheet
import PolicyAnalysisReport from '../components/PolicyAnalysisReport.jsx';
import { apiGet } from '../api';

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [updated, setUpdated] = useState(null);
  const [ossOnly, setOssOnly] = useState(false);

  useEffect(() => {
    apiGet('/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        setBoard(d.board);
        setUpdated(d.last_updated);
      })
      .catch(console.error);
  }, []);

  const visible = ossOnly ? board.filter((r) => r.open_source) : board;

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        Policy Leaderboard
      </h2>

      {updated && (
        <p style={{ textAlign: 'center', fontSize: '0.95rem', color: '#555' }}>
          Last updated&nbsp;{new Date(updated).toLocaleString()}
        </p>
      )}

      {/* ------- filter toggle ------- */}
      <div className="lb-filter">
        <label>
          <input
            type="checkbox"
            checked={ossOnly}
            onChange={(e) => setOssOnly(e.target.checked)}
          />{' '}
          Show open-source policies only
        </label>
      </div>

      {visible.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading…</p>
      ) : (
        <table className="lb-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Policy</th>
              <th className="right">Score</th>
              <th className="right">SD</th>
              {/* right-aligned header  ↓ */}
              <th className="right">Open&nbsp;Source</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, idx) => (          /* ← use filtered list */
              <tr key={r.policy}>
                <td className="left">{idx + 1}</td>
                <td>{r.policy}</td>
                <td className="right">{r.score}</td>
                <td className="right">{r.std}</td>
                {/* centre the ✔ without drifting left ↓ */}
                <td className="oss-cell">{r.open_source ? '✔️' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <PolicyAnalysisReport />
    </div>
  );
}
