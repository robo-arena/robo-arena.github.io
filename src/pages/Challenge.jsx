import '../css/theme.css';
import './challenge.css';     /* new page-specific styles */

export default function Challenge() {
  return (
    <div className="challenge-wrap">
      <h2 className="challenge-title">RoboArena × CoRL 2025 Challenge</h2>

      <div className="challenge-desc">
        <p>
          We will be hosting a generalist policy development challenge as part of CoRL 2025, using the RoboArena framework. The challenge will be embedded as part of 
          the first workshop on generalist policies in the wild: <a href="https://sites.google.com/view/corl-roboarena" target="_blank" rel="noopener noreferrer">https://sites.google.com/view/corl-roboarena</a>. If you are interested in participating, please fill out the form below to register your team. 
          In addition to members of the robotics community, we encourage participation from the broader ML/foundation model community, particularly folks interested 
          in robotics who may not have access to a robot. Participants in the challenge will be given extra evaluation credits for their policies on the RoboArena 
          evaluation platform. Winning teams will get a chance to present their approach at the workshop and run their policies live. Even if you don't intend to 
          compete to win, we encourage you to participate as we anticipate access to the evaluation network might be useful for research.
        </p>

        <ul className="timeline">
          <li><strong>June&nbsp;16&nbsp;2025</strong> – RoboArena public announcement; all materials, instructions & simulated environments released</li>
          <li><strong>Aug&nbsp;1&nbsp;–&nbsp;Aug&nbsp;15</strong> – Evaluation office hours - participants may test policies on real robots</li>
          <li><strong>Aug&nbsp;15</strong> – First real-world evaluation checkpoint; 1-week trial against baselines</li>
          <li><strong>Aug&nbsp;22&nbsp;–&nbsp;Sept&nbsp;5</strong> – Evaluation office hours (second window)</li>
          <li><strong>Sept&nbsp;5&nbsp;–&nbsp;Sept&nbsp;19</strong> – Final real-world evaluation period; winners determined</li>
        </ul>
      </div>

      {/* ——  embedded Google Form  —— */}
      <iframe
        title="CoRL RoboArena Challenge registration"
        className="challenge-iframe"
        src="https://docs.google.com/forms/d/e/1FAIpQLSd5bTPTTrPi1_01z5_bukgb35O7Mxk1gFerJF47nUcZr8BQKQ/viewform?embedded=true"
	loading="lazy"
        allowFullScreen
      />
    </div>
  );
}
