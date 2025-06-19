import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
} from 'react-router-dom';

import '../css/theme.css';

import Home from '../pages/Home.jsx';
import ResultsPage from '../pages/ResultsPage.jsx';
import Leaderboard from '../pages/Leaderboard.jsx';
import SubmitPolicy from '../pages/SubmitPolicy.jsx';
import JoinEvaluator from '../pages/JoinEvaluator.jsx';
//import Challenge from '../pages/Challenge.jsx';

export default function MainPage() {
  return (
    <Router>
      {/* -------- NAV BAR -------- */}
      <nav className="navbar">
        <Link to="/" className="logo">
          <img
            src="/robo_arena.png"
            alt="RoboArena logo"
            className="logo-img"
          />
          <span className="logo-word">RoboArena</span>
        </Link>

        {/* nav links with active styling */}
        <NavLink
          to="/results"
          className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
        >
          A/B Evaluation Viewer
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
        >
          Policy Leaderboard
        </NavLink>

        <NavLink
          to="/submit"
          className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
        >
          Evaluate Your Policy
        </NavLink>

        {/* <NavLink
          to="/challenge"
          className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
        >
          CoRL Challenge
        </NavLink> */}

        <NavLink
          to="/volunteer"
          className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
        >
          Join as an Evaluator
        </NavLink>

        <NavLink
          to="https://discord.com/invite/z7YjjHwNRP"
          className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Join our Discord
        </NavLink>
      </nav>

      {/* -------- ROUTES -------- */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/submit" element={<SubmitPolicy />} />
        <Route path="/volunteer" element={<JoinEvaluator />} />
        {/* <Route path="/challenge" element={<Challenge />} /> */}
      </Routes>
    </Router>
  );
}
