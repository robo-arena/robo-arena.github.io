import { Link } from 'react-router-dom'
import paperPdf from '../assets/roboarena.pdf'
import methodImg from '../assets/method_overview.jpeg';
import trainingImg from '../assets/training.png';
import evaluationImg from '../assets/eval.png';
import leaderboardImg from '../assets/leaderboard.png';
import simEvalVideo from '../assets/sim_eval.mp4';
import discordImg from '../assets/discord.svg';
import { HiOutlineDatabase } from 'react-icons/hi'
import '../css/theme.css'
import './home.css'               // small local styles

/* ---------- quick helpers ---------- */
const authors = [
  { name: 'Pranav Atreya',   uni: 1, equal: true  },
  { name: 'Karl Pertsch',       uni: [1,2], equal: true  },
  { name: 'Tony Lee',       uni: 2, equal: true  },
  { name: 'Moo Jin Kim',       uni: 2, equal: false  },
  { name: 'Arhan Jain',       uni: 3, equal: false  },
  { name: 'Artur Kuramshin',       uni: 4, equal: false  },
  { name: 'Clemens Eppner',       uni: 5, equal: false  },
  { name: 'Cyrus Neary',       uni: 4, equal: false  },
  { name: 'Edward Hu',       uni: 6, equal: false  },
  { name: 'Fabio Ramos',       uni: 5, equal: false  },
  { name: 'Jonathan Tremblay',       uni: 5, equal: false  },
  { name: 'Kanav Arora',       uni: 3, equal: false  },
  { name: 'Kirsty Ellis',       uni: 4, equal: false  },
  { name: 'Luca Macesanu',       uni: 7, equal: false  },
  { name: 'Matthew Leonard',       uni: 6, equal: false  },
  { name: 'Meedeum Cho',       uni: 8, equal: false  },
  { name: 'Ozgur Aslan',       uni: 4, equal: false  },
  { name: 'Shivin Dass',       uni: 7, equal: false  },
  { name: 'Jie Wang',       uni: 6, equal: false  },
  { name: 'Xingfang Yuan',       uni: 6, equal: false  },
  { name: 'Xuning Yang',       uni: 5, equal: false  },
  { name: 'Abhishek Gupta',       uni: 3, equal: false  },
  { name: 'Dinesh Jayaraman',       uni: 6, equal: false  },
  { name: 'Glen Berseth',       uni: 4, equal: false  },
  { name: 'Kostas Daniilidis',       uni: 6, equal: false  },
  { name: 'Roberto Martin-Martin',       uni: 7, equal: false  },
  { name: 'Youngwoon Lee',       uni: 8, equal: false  },
  { name: 'Percy Liang',       uni: 2, equal: false  },
  { name: 'Chelsea Finn',       uni: 2, equal: false  },
  { name: 'Sergey Levine',       uni: 1, equal: false  },
];

const universities = [
  'University of California, Berkeley',
  'Stanford University',
  'University of Washington',
  'Université de Montréal',
  'NVIDIA',
  'University of Pennsylvania',
  'UT Austin',
  'Yonsei University',
]

export default function Home() {
  return (
    <div className="home-wrap">

      {/* Title */}
      <h1 className="paper-title">
        RoboArena:&nbsp;
        <span className="subtitle">
          Distributed Real-World Evaluation of Generalist Robot Policies
        </span>
      </h1>

      {/* Author line */}
      <p className="author-line">
      {authors.map((a, idx) => {
        // convert uni to an array for uniform handling
        const nums = Array.isArray(a.uni) ? a.uni : [a.uni];

        // superscript string: optional * + comma-separated numbers
        const sup = `${a.equal ? '*' : ''}${nums.join(',')}`;

        return (
          <span key={idx}>
            {a.name}
            <sup>{sup}</sup>
            {idx < authors.length - 1 && ', '}
          </span>
        );
      })}
    </p>

      {/* Footnotes */}
      <ol className="footnotes">
        {universities.map((u, i) => (
          <li key={i}>{u}</li>
        ))}
      </ol>

      {/* co-first author note */}
      <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '-1.5rem', marginBottom: '1.5rem' }}>
        *: Core contributors
      </p>

      {/* Quick-links grid */}
      <div className="link-grid">
        <a
          href={paperPdf}
          className="link-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="icon">📄</span>
          Paper
        </a>

        <a
          href="https://github.com/robo-arena/roboarena"
          className="link-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="icon">💻</span>
          Code
        </a>

        <Link to="/results" className="link-card">
          <span className="icon">🎞️</span>        {/* clapper board / cinema */}
          A/B Evaluation Viewer
        </Link>

        <Link to="/leaderboard" className="link-card">
          <span className="icon">🏆</span>
          Leaderboard
        </Link>

        <Link to="/submit" className="link-card">
          <span className="icon">📤</span>
          Evaluate Your Policy
        </Link>

        {/* <Link to="/challenge" className="link-card">
          <span className="icon">🚀</span>
          CoRL Challenge
        </Link> */}

        <Link to="/volunteer" className="link-card">
        <span className="icon">🤝</span>
        Join as
        Evaluator
        </Link>

        <Link
          to="https://discord.com/invite/z7YjjHwNRP"
          className="link-card"
          // Opens Discord link in a new tab
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={discordImg}
            alt="Discord logo"
            className="icon"
            style={{ width: '48px', height: '48px' }}
          />
          <span style={{ display: 'inline-block', marginTop: '10px' }}>
            Join our Discord
          </span>
        </Link>
      </div>

      <section className="tldr-wrap">
        <h2 className="tldr-title">TL;DR</h2>
        <p style={{ margin: 0, textAlign: 'left', lineHeight: 1.6 }}>
          <strong>RoboArena is a community-run, real-world benchmark for evaluating
          generalist robot policies, instantiated currently on the DROID robot platform.</strong> You 
          can <Link to="/submit">submit your policy</Link> to be evaluated by our pool of volunteer evaluators,
          or become an evaluator yourself. RoboArena evaluations differ from traditional robot evaluation in 
          one key principle: instead of standardizing the set of tasks for which all policies are evaluated, 
          we allow evaluators to pick <strong>any environment and task of their choice</strong> for each evaluation. The only 
          requirement is that evaluations are done pairwise, maintaining the same task and environment for the policies in the pair.
          By aggregating a large number of double-blind, pairwise evaluations across a network of institutions, 
          we can <strong>considerably scale evaluation diversity</strong>,
          which we&nbsp;<a href={paperPdf} target="_blank" rel="noopener noreferrer">
          show</a>&nbsp;is essential to comprehensively evaluate <em>generalist</em> policies. 
          The RoboArena benchmark will be running live through 2025, with potential extensions beyond.
        </p>
      </section>

      {/* ---------- BODY SECTION ---------- */}
      <section className="body-section">
        <img src={methodImg} alt="Method overview of RoboArena" className="body-img" />

        <h2 className="section-title" style={{textAlign: 'left', marginBottom: '1rem', fontSize: '2rem'}}>How does RoboArena work?</h2>
        
        <div className="process-card">
          <div className="card-content">
            <div className="process-img-wrap">
              <img src={trainingImg} alt="Training a robot policy" className="process-img" />
            </div>
            <div className="process-text">
              <h3>1. Train your policy</h3>
              <p>
                Develop and train your robot policy using any method you prefer. The only
                requirement is that your policy can run on the DROID robot platform and
                accept standard observation inputs. We provide data and code to get started <a href="#resources-section">below</a>.
              </p>
            </div>
          </div>
        </div>

        <div className="process-card">
          <div className="card-content reverse">
            <div className="process-img-wrap">
              <img src={evaluationImg} alt="Submitting a policy" className="process-img" />
            </div>
            <div className="process-text">
              <h3>2. Submit for evaluation</h3>
              <p>
                Once trained, host your policy on a policy server so we can query it remotely (don't worry, we have code for this).
                Then submit your policy server to our evaluation system and we will distribute it to our pool of evaluators.
              </p>
            </div>
          </div>
        </div>

        <div className="process-card">
          <div className="card-content">
            <div className="process-img-wrap">
              <img src={leaderboardImg} alt="Policy evaluation" className="process-img" />
            </div>
            <div className="process-text">
              <h3>3. Get comprehensive evaluation results</h3>
              <p>
                Your policy will get tested in A/B comparisons against other policies in the pool,
                and you will be able to see evaluation results and your policy's ranking on the leaderboard.
                You have a weekly budget of policy evaluations, and can get more by contributing evaluations yourself!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title" style={{textAlign: 'left', fontSize: '2rem'}}>Why distributed evaluation?</h2>
        
        <div className="process-card">
          <div className="card-content">
            <div className="process-text" style={{width: '100%', maxWidth: 'none', textAlign: 'left'}}>
              <p style={{fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem'}}>
                Traditionally, benchmarking has been a challenge for robotics: reproducing test conditions accurately in the real world
                is difficult in a single lab, and even more so across institutions. For <strong>generalist</strong> policies,
                these challenges compound: policies need to be evaluated not just on one task, but on a wide variety of tasks and scenes.
              </p>
              
              <p style={{fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem'}}>
                RoboArena's <strong>distributed evaluation</strong> approach tries to address these challenges. It enables RoboArena to be:
              </p>
              <div style={{
                marginTop: '0.5rem',
                marginLeft: '2rem',
                lineHeight: '1.6',
                fontSize: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '1rem'}}>
                  <strong style={{minWidth: '140px'}}>Comprehensive</strong>
                  <p style={{margin: 0}}>Policies are evaluated on a broader set of tasks and environments than is practical in a single lab. The task distribution can evolve with policy capabilities.</p>
                </div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '1rem'}}>
                  <strong style={{minWidth: '140px'}}>Trustworthy</strong>
                  <p style={{margin: 0}}>Evaluations are double-blind and distributed across institutions. Evaluators are not aware which policy they are evaluating.</p>
                </div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '1rem'}}>
                  <strong style={{minWidth: '140px'}}>Scalable</strong>
                  <p style={{margin: 0}}>Evaluations can be run anywhere, at any time, and the network of evaluators makes RoboArena robust to hardware failures, graduating students, etc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 id="resources-section" className="section-title" style={{textAlign: 'center', marginBottom: '1rem', fontSize: '2rem'}}>Resources</h2>
        <div className="resources-container">
          <div className="resource-card">
            <div className="resource-icon">
              <HiOutlineDatabase size={100} color="#444" />
            </div>
            <h3>Data</h3>
            <p>
              Access the open-source <a href="https://droid-dataset.github.io/" target="_blank" rel="noopener noreferrer">DROID dataset</a>, which contains robot demonstrations across many tasks and environments. 
            </p>
            <a href="https://droid-dataset.github.io/" target="_blank" rel="noopener noreferrer" className="resource-link">Browse Dataset →</a>
          </div>

          <div className="resource-card">
            <div className="resource-icon">
              <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub icon" />
            </div>
            <h3>Model Code</h3>
            <p>
              Get started with our baseline implementation of the π₀-FAST-DROID training pipeline. 
              Includes documentation and examples to help you build your own solutions.
            </p>
            <a href="https://github.com/Physical-Intelligence/openpi/blob/main/examples/droid/README_train.md" target="_blank" rel="noopener noreferrer" className="resource-link">View Code →</a>
          </div>

          <div className="resource-card">
            <div className="resource-icon" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              <video 
                src={simEvalVideo}
                autoPlay
                loop
                muted
                playsInline
                style={{ 
                  width: '213px', 
                  height: '120px', 
                  objectFit: 'cover'
                }}
              />
            </div>
            <h3>Simulated Evaluation</h3>
            <p>
              Test your policies in our simulation environment before submitting for real-world evaluation.
              Helps ensure compatibility and basic functionality.
            </p>
            <a href="https://github.com/arhanjain/sim-evals" target="_blank" rel="noopener noreferrer" className="resource-link">Try Simulator →</a>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 id="citation-section" className="section-title" style={{textAlign: 'center', marginBottom: '1rem', fontSize: '2rem'}}>Citation</h2>
        <div style={{maxWidth: '800px', margin: '0 auto', padding: '1rem'}}>
          <p style={{marginBottom: '1rem', textAlign: 'left'}}>
            If you find this work useful in your research, please consider citing:
          </p>
          <pre style={{
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflowX: 'auto',
            fontSize: '0.9rem',
            lineHeight: '1.4',
            textAlign: 'left'
          }}>
{`@article{atreya2025roboarena,
  title={RoboArena: Distributed Real-World Evaluation of Generalist Robot Policies},
  author={Atreya, Pranav and Pertsch, Karl and Lee, Tony and Kim, Moo Jin and Jain, Arhan and Kuramshin, Artur and Eppner, Clemens and Neary, Cyrus and Hu, Edward and Ramos, Fabio and Tremblay, Jonathan and Arora, Kanav and Ellis, Kirsty and Macesanu, Luca and Leonard, Matthew and Cho, Meedeum and Aslan, Ozgur and Dass, Shivin and Wang, Jie and Yuan, Xingfang and Yang, Xuning and Gupta, Abhishek and Jayaraman, Dinesh and Berseth, Glen and Daniilidis, Kostas and Martin-Martin, Roberto and Lee, Youngwoon and Liang, Percy and Finn, Chelsea and Levine, Sergey},
  journal={arXiv preprint},
  year={2025}
}`}
          </pre>
        </div>
      </section>

    </div>
  )
}
