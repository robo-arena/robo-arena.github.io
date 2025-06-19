const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

/**
 * Convenience wrapper for GET requests.
 * Usage: apiGet('/leaderboard').then(r => r.json())
 */
export function apiGet(path, init = {}) {
  return fetch(`${API_BASE}${path}`, { ...init });
}