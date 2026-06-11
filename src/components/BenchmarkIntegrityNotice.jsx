import { Link } from 'react-router-dom';
import './benchmarkIntegrityNotice.css';

export function BenchmarkIntegrityLetter() {
  return (
    <section
      id="benchmark-integrity-update"
      className="benchmark-integrity-notice benchmark-integrity-letter"
      aria-label="RoboArena benchmark integrity notice"
    >
      <div className="benchmark-integrity-body">
        <p>
          Ensuring RoboArena is a fair and trustworthy benchmark is of critical
          importance to us. At sufficient scale, RoboArena's decentralized design means
          individual bad actors cannot easily sway the results. However, we are not yet
          at this scale, and we have observed evidence of benchmark manipulation.
        </p>
        <p>
          To ensure integrity of the benchmark, we are now enforcing that only
          third-party evaluators who have no stake through submitted policies can
          volunteer evals. Alongside this change, which we implemented retroactively,
          we have excluded evals from organizations with suspicious evaluation
          patterns. Our method for assessing suspicion was numerical: there were
          several means by which A/B evals were manipulated, one of
          which manifested as unusually low completion rates for requested evaluation
          assignments. We decided that organizations completing less than 20% of their
          requested evals would be flagged. These retroactive changes affect evals
          beginning from April 2, 2026; before that date, we did not find evidence
          requiring retroactive exclusion.
        </p>
        <p>
          We want to thank the community for their support; community oversight with
          fully public evals was one of our goals, and so we are glad to see this
          working. To make it easier for the community to audit evaluations, we have
          made acquisition of evaluation data easier and have updated the website with
          a number of hopefully useful metrics and visualizations.
        </p>
      </div>
      <p className="benchmark-integrity-signoff">
        <span>Best,</span>
        <strong>The RoboArena Team</strong>
      </p>
    </section>
  );
}

export function BenchmarkIntegrityCallout() {
  return (
    <section className="benchmark-integrity-notice benchmark-integrity-callout">
      <span>
        We have made an update to RoboArena to improve its benchmark integrity:{' '}
        <Link to="/#benchmark-integrity-update">read the note.</Link>
      </span>
    </section>
  );
}
