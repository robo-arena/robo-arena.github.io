import { Link } from 'react-router-dom';
import './benchmarkIntegrityNotice.css';

export function BenchmarkIntegrityLetter() {
  return (
    <section
      id="benchmark-integrity-update"
      className="benchmark-integrity-notice benchmark-integrity-letter"
      aria-labelledby="benchmark-integrity-title"
    >
      <div id="benchmark-integrity-title" className="benchmark-integrity-kicker">
        Benchmark Integrity Update
      </div>
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
          we have retroactively discarded evals from organizations we found to be
          engaging in suspicious activities. Our method for assessing suspicion was
          numerical: there were several means by which A/B evals were rigged, one of
          which manifested as a very small fraction of requested evals actually being
          performed. We decided that organizations who contributed evals at a less than
          20% rate would be flagged. These retroactive changes affect evals beginning
          from April 2, 2026, before which we deemed all evals to be sound.
        </p>
        <p>
          We want to thank the community for their support; community oversight with
          fully public evals was one of our goals, and so we're glad to see this
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
      <strong>Benchmark integrity update.</strong>
      <span>
        RoboArena is enforcing third-party evaluation rules and has retroactively
        discarded suspicious evals.{' '}
        <Link to="/#benchmark-integrity-update">Read the full update on the main page.</Link>
      </span>
    </section>
  );
}
