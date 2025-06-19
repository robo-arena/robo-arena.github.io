import { useEffect, useState, useRef } from 'react'
import EvaluationCard from '../components/EvaluationCard.jsx'
import '../css/theme.css'
import { apiGet } from '../api';

export default function ResultsPage() {
  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  const [allEvals, setAllEvals] = useState([])
  const [shown, setShown] = useState(10)
  const [query, setQuery] = useState('')
  const loaderRef = useRef(null)

  /* ------------------------------------------------------------------ */
  /* data fetch helper                                                   */
  /* ------------------------------------------------------------------ */
  const fetchData = () =>
    apiGet('/list_ab_evaluations')
      .then((r) => r.json())
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

  /* special “tie” keyword → show only ties */
  const wantTieOnly = tokens.some((t) => ['tie', 'ties', 'tie:'].includes(t))
  const tokensWithoutTie = tokens.filter(
    (t) => !['tie', 'ties', 'tie:'].includes(t)
  )

  const filtered = allEvals.filter((e) => {
    if (wantTieOnly && (e.preference ?? '').toUpperCase() !== 'TIE') return false

    /* logical AND across all remaining tokens */
    return tokensWithoutTie.every((tok) =>
      [
        e.university,
        e.evaluator_name ?? '',
        e.policyA.name,
        e.policyB.name,
        new Date(e.completion_time).toLocaleString(),
      ]
        .map((s) => s.toLowerCase())
        .some((field) => field.includes(tok))
    )
  })

  /* newest-first order */
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.completion_time) - new Date(a.completion_time)
  )

  const visible = sorted.slice(0, shown)

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ marginBottom: '1rem', textAlign: 'center'}}>A/B Evaluation Viewer</h2>

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
        <EvaluationCard key={ev.session_id} evalData={ev} />
      ))}

      {/* sentinel for IntersectionObserver */}
      <div ref={loaderRef} style={{ height: 1 }} />
    </div>
  )
}
