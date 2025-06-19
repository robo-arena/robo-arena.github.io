import '../css/theme.css';
import './joinEvaluator.css';

export default function joinEvaluator() {
  return (
    <div className="submit-wrap">
      {/* <h2>Volunteer&nbsp;to&nbsp;Evaluator&nbsp;Policies&nbsp;for&nbsp;RoboArena</h2>

      {/*  ——  embedded Google Form  ——  */}
      <iframe
        title="Evaluator sign-up form"
        className="submit-iframe"
        src="https://docs.google.com/forms/d/e/1FAIpQLSfkUwcbFwOQHTc0H-P41NwJdFFm0g2MhGs5mEKfSj6oNhcqLg/viewform?embedded=true"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
