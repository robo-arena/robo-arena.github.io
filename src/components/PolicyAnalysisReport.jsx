import { useEffect, useState } from 'react';
import './policyAnalysis.css';
import { apiGet } from '../api';

export default function PolicyAnalysisReport() {
  const [policies, setPolicies] = useState([]);
  const [hoverVid, setHoverVid] = useState(null);

  /* fetch once */
  useEffect(() => {
    apiGet('/policy_analysis.json')
      .then((r) => {
        if (!r.ok) throw new Error('analysis report not available');
        return r.json();
      })
      .then(setPolicies)
      .catch(console.error);
  }, []);

  return (
    <section className="analysis-section" style={{ marginTop: '3rem' }}>
      <h3 className="analysis-title">AI-Generated Policy Analysis Reports</h3>
        <p  className="analysis-updated">
            Last updated&nbsp;5/26/2025
        </p>
      <p className="analysis-desc" style={{ textAlign: 'right', marginBottom: '0.5rem', fontWeight: 300 }}>Click '+' to expand and see video citations.</p>

      <div className="analysis-container">
        {policies.map((p) => (
          <PolicyCard key={p.policy_name} data={p} setHoverVid={setHoverVid} />
        ))}
      </div>

      {/* floating video popup */}
      {hoverVid && (
        <div id="video-popup" onMouseLeave={() => setHoverVid(null)}>
          <div id="popup-prompt">{hoverVid.prompt}</div>
          <div id="popup-speed">4× speed</div>
          <video
            id="popup-video"
            ref={(el) => el && (el.playbackRate = 4)}
            src={hoverVid.src}
            autoPlay
            muted
            controls
            style={{ width: '100%', borderRadius: 8 }}
          />
        </div>
      )}
    </section>
  );
}

function PolicyCard({ data, setHoverVid }) {
  const [open, setOpen] = useState(false);

  const renderRefs = (html) =>
    html.replace(/<ref>(.*?)<\/ref>/g, (_, sid) => {
      const path = data.session_id_to_video_path[sid] || '';
      const prompt = data.session_id_to_prompt[sid] || '';
      const short = sid.split('-')[0];
      return path
        ? `<span class='hover-ref' data-vid='${path}' data-prompt='${prompt}'>🎥 ${short}</span>`
        : `<span class='hover-ref missing-video'>🎥 ${short}</span>`;
    });

  const handleMouseOver = (e) => {
    const el = e.target.closest('.hover-ref');
    if (!el || !el.dataset.vid) return;
    setHoverVid({
      src: `https://storage.googleapis.com/distributed_robot_eval/${el.dataset.vid}`,
      prompt: el.dataset.prompt,
    });
  };

  return (
    <div className="policy-card" onMouseOver={handleMouseOver}>
      <div className="policy-header" onClick={() => setOpen((o) => !o)}>
        <strong>{data.policy_name}</strong>
        <button className="toggle-button">
        {open ? '➖' : '➕'}
        </button>
      </div>

      <pre className="policy-summary">{data.summary}</pre>

      {open && (
        <div className="policy-full">
          <div className="full-title">Full Report</div>
          <div
            className="full-content"
            dangerouslySetInnerHTML={{ __html: renderRefs(data.full_report) }}
          />
        </div>
      )}
    </div>
  );
}
