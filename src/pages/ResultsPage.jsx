import { useEffect, useMemo, useState, useRef } from 'react'
import EvaluationCard from '../components/EvaluationCard.jsx'
import TransparencyDashboard from '../components/TransparencyDashboard.jsx'
import '../css/theme.css'
import './results.css'
import { apiGetJson } from '../api';
import { buildTransparencyStats, isRankingIncludedEvaluation } from '../utils/transparencyStats';

export default function ResultsPage() {
  const initialQuery = (() => {
    try {
      return new URLSearchParams(window.location.search).get('q') ?? '';
    } catch {
      return '';
    }
  })();

  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  const [allEvals, setAllEvals] = useState([])
  const [shown, setShown] = useState(10)
  const [query, setQuery] = useState(initialQuery)
  const [shareStatus, setShareStatus] = useState('idle')
  const loaderRef = useRef(null)

  /* ------------------------------------------------------------------ */
  /* data fetch helper                                                   */
  /* ------------------------------------------------------------------ */
  const fetchData = () =>
    apiGetJson('/list_ab_evaluations')
      .then((d) => setAllEvals(d.evaluations))
      .catch(console.error)

  /* run once on mount */
  useEffect(() => {
      fetchData();          // call it, ignore the returned Promise
    }, [])    

  /* ------------------------------------------------------------------ */
  /* infinite-scroll sentinel                                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setShown((c) => c + 10),
      { threshold: 1 }
    )
    if (loaderRef.current) io.observe(loaderRef.current)
    return () => io.disconnect()
  }, [])

  /* ------------------------------------------------------------------ */
  /* search / filter                                                     */
  /* ------------------------------------------------------------------ */
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  const sessionTokens = tokens
    .filter((t) => t.startsWith('sid:') || t.startsWith('session:'))
    .map((t) => t.split(':').slice(1).join(':').trim())
    .filter(Boolean)

  /* special “tie” keyword → show only ties */
  const wantTieOnly = tokens.some((t) => ['tie', 'ties', 'tie:'].includes(t))
  const tokensWithoutTie = tokens.filter(
    (t) => !['tie', 'ties', 'tie:'].includes(t)
  )
  const genericTokens = tokensWithoutTie.filter(
    (t) => !t.startsWith('sid:') && !t.startsWith('session:')
  )

  const filtered = allEvals.filter((e) => {
    if (wantTieOnly && (e.preference ?? '').toUpperCase() !== 'TIE') return false
    if (
      sessionTokens.length > 0 &&
      !sessionTokens.every((needle) =>
        (e.session_id ?? '').toLowerCase().includes(needle)
      )
    ) return false

    /* logical AND across all remaining tokens */
    return genericTokens.every((tok) =>
      [
        e.university,
        e.evaluator_name ?? '',
        e.policyA.name,
        e.policyB.name,
        e.session_id ?? '',
        new Date(e.completion_time).toLocaleString(),
      ]
        .map((s) => s.toLowerCase())
        .some((field) => field.includes(tok))
    )
  })

  const transparencyStats = useMemo(
    () => buildTransparencyStats(allEvals),
    [allEvals]
  )
  const filteredTransparencyCount = useMemo(
    () => filtered.filter(isRankingIncludedEvaluation).length,
    [filtered]
  )

  /* newest-first order */
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.completion_time) - new Date(a.completion_time)
  )

  const visible = sorted.slice(0, shown)

  const copyToClipboard = async (text) => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const buildResultsLink = (searchQuery) => {
    const url = new URL('/results', window.location.origin);
    const trimmed = (searchQuery ?? '').trim();
    if (trimmed) url.searchParams.set('q', trimmed);
    return url.toString();
  };

  const copySearchLink = async (searchQuery) => {
    const ok = await copyToClipboard(buildResultsLink(searchQuery));
    return ok;
  };

  const handleCopyCurrentSearch = async () => {
    const ok = await copySearchLink(query);
    setShareStatus(ok ? 'copied' : 'error');
    window.setTimeout(() => setShareStatus('idle'), 1800);
  };

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="results-page-wrap">
      <h2 style={{ marginBottom: '1rem', textAlign: 'center'}}>A/B Evaluation Viewer</h2>

      <TransparencyDashboard
        evaluations={allEvals}
        stats={transparencyStats}
        filteredCount={filteredTransparencyCount}
        query={query}
      />

      <div className="results-browser-divider" aria-label="A/B evaluation browser">
        <span>A/B Evaluation Browser</span>
        <strong>
          {filtered.length.toLocaleString()} record{filtered.length === 1 ? '' : 's'} shown
        </strong>
      </div>

      {/* search bar + reset / refresh */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <input
          style={{ flex: '1 1 240px', padding: '0.5rem' }}
          placeholder="Search by university, policy name, evaluator name, tie, date, or combinations thereof (e.g., Berkeley 4/25 pi0_droid)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* Reset — gray background */}
        <button
          style={{
            padding: '0.45rem 0.9rem',
            fontWeight: 400,
            cursor: 'pointer',
            background: '#004080',          // ← navy / dark blue
            color: '#ffffff',
            border: '1px solid #003460',
          }}
          title="Clear filters and reload"
          onClick={() => {
            setQuery('');
            setShown(10);
            fetchData();
          }}
        >
          Reset
        </button>

        <button
          style={{
            padding: '0.45rem 0.9rem',
            fontWeight: 400,
            cursor: 'pointer',
            background: '#004080',
            color: '#ffffff',
            border: '1px solid #003460',
          }}
          title="Copy link to current filtered view"
          onClick={handleCopyCurrentSearch}
        >
          {shareStatus === 'copied'
            ? 'Copied!'
            : shareStatus === 'error'
              ? 'Copy failed'
              : 'Copy Link'}
        </button>

        {/* Refresh — dark blue background */}
        <button
          style={{
            padding: '0.2rem',
            fontSize: '1.6rem',
            lineHeight: 1,
            cursor: 'pointer',
            background: '#004080',          // ← navy / dark blue
            color: '#ffffff',
            border: '1px solid #003460',
            borderRadius: '4px',
          }}
          title="Refresh list"
          onClick={() => fetchData()}
        >
          ⟳
        </button>
      </div>

      {allEvals.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <span className="loader" /> {/* or just “Loading…” */}
        </div>
      )}

      {visible.map((ev) => (
        <EvaluationCard
          key={ev.session_id}
          evalData={ev}
          onShare={async () => copySearchLink(`sid:${ev.session_id}`)}
        />
      ))}

      {/* sentinel for IntersectionObserver */}
      <div ref={loaderRef} style={{ height: 1 }} />
    </div>
  )
}
