import { useState, useRef, useEffect } from 'react'
import '../css/theme.css'

export default function EvaluationCard({ evalData }) {
  const {
    completion_time,
    university,
    evaluator_name,
    preference,
    longform_feedback,
    language_instruction,
    policyA,
    policyB,
  } = evalData

  const cardRef = useRef(null)
  const [visible, setVisible] = useState(false) // in viewport?
  const [open, setOpen] = useState(false)       // accordion expanded?

  /* viewport detector */
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.15 }
    )
    if (cardRef.current) io.observe(cardRef.current)
    return () => io.disconnect()
  }, [])

  const fmtDate = new Date(completion_time).toLocaleString()

  return (
    <div className="evaluation-card" ref={cardRef}>
      {/* HEADER (always visible) */}
      <button
        className="card-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="header-content">
          <div className="header-line">
            <strong>{fmtDate}</strong>

            <span className="pipe">|</span>

            <span className="pill pill-uni">{university}</span>

            <span className="pipe">|</span>

            <span className="pill pill-policy">
              <strong>Policy&nbsp;A:</strong>&nbsp;{policyA.name}
            </span>

            <span className="pipe">|</span>

            <span className="pill pill-policy">
              <strong>Policy&nbsp;B:</strong>&nbsp;{policyB.name}
            </span>

            {preference && (
              <>
                <span className="pipe">|</span>
                <span className="pill pill-pref">
                  <strong>Pref:</strong>&nbsp;{preference}
                </span>
              </>
            )}
          </div>

          {evaluator_name && (
            <div className="evaluator-line">
              <strong>Evaluator:</strong>&nbsp;{evaluator_name}
            </div>
          )}

          {language_instruction && (
            <div className="instruction-line">
              <strong>Instruction:</strong>&nbsp;{language_instruction}
            </div>
          )}

          {longform_feedback && (
            <div className="feedback-line">
              <strong>Feedback:</strong>&nbsp;{longform_feedback}
            </div>
          )}
        </div>
        <span className="toggle-icon">{open ? '➖' : '➕'}</span>
      </button>

      {/* ACCORDION BODY */}
      {open && (
        <div className="card-body">
          <PolicyBlock
            label="A"
            data={policyA}
            showVideos={open}
          />

          {/* centred black divider */}
          <div className="mid-divider" />

          <PolicyBlock
            label="B"
            data={policyB}
            showVideos={open}
          />
        </div>
      )}
    </div>
  )
}

function PolicyBlock({ label, data, showVideos }) {
  const {
    partial_success,
    wrist_video_url,
    third_person_video_url,
  } = data

  return (
    <div className="policy-block">
      <h4 className="policy-heading">
        Policy {label}
        {partial_success !== null &&
          ` • partial success ${(partial_success * 100).toFixed(1)}%`}
      </h4>

      {showVideos && (
        <div className="video-stack">
          {third_person_video_url && (
            <VideoPlayer
              url={third_person_video_url}
              caption="Shoulder-view"
            />
          )}
          {wrist_video_url && (
            <VideoPlayer url={wrist_video_url} caption="Wrist-view" />
          )}
        </div>
      )}
    </div>
  )
}

function VideoPlayer({ url, caption }) {
  return (
    <div className="video-container">
      <video
        src={url}
        playsInline
        muted
        autoPlay
        loop
        preload="none"
      />
      <span className="video-caption">{caption}</span>
    </div>
  )
}
