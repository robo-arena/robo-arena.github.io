import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import EvaluationCard from '../components/EvaluationCard.jsx'
import TransparencyDashboard from '../components/TransparencyDashboard.jsx'
import { BenchmarkIntegrityCallout } from '../components/BenchmarkIntegrityNotice.jsx'
import '../css/theme.css'
import './results.css'
import { apiGetJson } from '../api';
import {
  buildTransparencyStatsFromSummary,
  isRankingIncludedEvaluation,
} from '../utils/transparencyStats';

const RESULTS_PAGE_SIZE = 20;

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
  const [visibleEvals, setVisibleEvals] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingPage, setIsLoadingPage] = useState(false)
  const [pageError, setPageError] = useState(null)
  const [transparencySummary, setTransparencySummary] = useState(null)
  const [requestStats, setRequestStats] = useState(null)
  const [query, setQuery] = useState(initialQuery)
  const [shareStatus, setShareStatus] = useState('idle')
  const loaderRef = useRef(null)
  const requestSeqRef = useRef(0)

  /* ------------------------------------------------------------------ */
  /* data fetch helper                                                   */
  /* ------------------------------------------------------------------ */
  const fetchPage = useCallback(({ offset = 0, replace = false, searchQuery = query } = {}) => {
    const requestSeq = requestSeqRef.current + 1
    requestSeqRef.current = requestSeq
    setIsLoadingPage(true)
    setPageError(null)

    const params = new URLSearchParams({
      limit: String(RESULTS_PAGE_SIZE),
      offset: String(offset),
    })
    const trimmed = searchQuery.trim()
    if (trimmed) params.set('q', trimmed)

    apiGetJson(`/list_ab_evaluations?${params.toString()}`)
      .then((d) => {
        if (requestSeq !== requestSeqRef.current) return
        setVisibleEvals((prev) =>
          replace ? d.evaluations : [...prev, ...d.evaluations]
        )
        setTotalCount(d.total ?? d.evaluations.length)
        setHasMore(Boolean(d.has_more ?? d.hasMore))
      })
      .catch((error) => {
        if (requestSeq !== requestSeqRef.current) return
        console.error(error)
        setPageError('Could not load A/B evaluations.')
      })
      .finally(() => {
        if (requestSeq === requestSeqRef.current) {
          setIsLoadingPage(false)
        }
      })
  }, [query])

  const fetchStats = useCallback(() => {
    apiGetJson('/transparency_summary')
      .then((d) => setTransparencySummary(d))
      .catch(() => setTransparencySummary(null))

    apiGetJson('/evaluator_request_stats')
      .then((d) => setRequestStats(d))
      .catch(() => setRequestStats(null))
  }, [])

  /* run once on mount */
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisibleEvals([])
      setTotalCount(0)
      setHasMore(false)
      fetchPage({ offset: 0, replace: true, searchQuery: query })
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [fetchPage, query])

  /* ------------------------------------------------------------------ */
  /* infinite-scroll sentinel                                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingPage) {
          fetchPage({ offset: visibleEvals.length, replace: false, searchQuery: query })
        }
      },
      { threshold: 1 }
    )
    if (loaderRef.current) io.observe(loaderRef.current)
    return () => io.disconnect()
  }, [fetchPage, hasMore, isLoadingPage, query, visibleEvals.length])

  const transparencyStats = useMemo(
    () => buildTransparencyStatsFromSummary(transparencySummary, requestStats),
    [transparencySummary, requestStats]
  )

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

  const downloadAllCountedEvals = async () => {
    const d = await apiGetJson('/list_ab_evaluations')
    const countedEvaluations = (d.evaluations || []).filter(isRankingIncludedEvaluation)
    return {
      generated_at: new Date().toISOString(),
      count: countedEvaluations.length,
      evaluations: countedEvaluations,
    }
  }

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="results-page-wrap">
      <h2 style={{ marginBottom: '1rem', textAlign: 'center'}}>A/B Evaluation Viewer</h2>

      <BenchmarkIntegrityCallout />

      <TransparencyDashboard
        stats={transparencyStats}
        filteredCount={totalCount}
        query={query}
        onDownloadEvals={downloadAllCountedEvals}
      />

      <div className="results-browser-divider" aria-label="A/B evaluation browser">
        <span>A/B Evaluation Browser</span>
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
            fetchStats();
            fetchPage({ offset: 0, replace: true, searchQuery: '' });
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
          onClick={() => {
            fetchStats();
            fetchPage({ offset: 0, replace: true, searchQuery: query });
          }}
        >
          ⟳
        </button>
      </div>

      {pageError && (
        <p style={{ textAlign: 'center', color: '#9b1c1c' }}>{pageError}</p>
      )}

      {visibleEvals.length === 0 && isLoadingPage && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <span className="loader" /> {/* or just “Loading…” */}
        </div>
      )}

      {visibleEvals.map((ev) => (
        <EvaluationCard
          key={ev.session_id}
          evalData={ev}
          onShare={async () => copySearchLink(`sid:${ev.session_id}`)}
        />
      ))}

      {/* sentinel for IntersectionObserver */}
      <div ref={loaderRef} style={{ minHeight: 24, textAlign: 'center', color: '#5e6572' }}>
        {isLoadingPage && visibleEvals.length > 0 ? 'Loading more...' : ''}
      </div>
    </div>
  )
}
