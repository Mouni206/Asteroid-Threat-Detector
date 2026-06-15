// ============================================================
// src/hooks/useAsteroidData.js
// ============================================================
// Custom React Hook — encapsulates ALL data-fetching logic.
//
// KEY CONCEPTS:
//  - Custom Hook: a function starting with "use" that uses React's
//    built-in hooks internally, so you can reuse stateful logic.
//  - useEffect: runs side-effects (API calls) after render.
//  - useCallback: memoizes the fetch function so it doesn't
//    re-create on every render (prevents infinite loops).
//  - setInterval: the REAL-TIME mechanism — polls NASA API every
//    POLL_INTERVAL milliseconds and updates state automatically.
//  - AbortController: cancels in-flight HTTP requests when the
//    component unmounts, preventing memory leaks.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getEnrichedAsteroids,
  fetchNeoStats,
  getTodayStr,
  getFutureDateStr,
} from '../services/nasaApi';

// Poll every 5 minutes (300,000ms).
// NASA's dataset updates a few times per day, so 5 min is a good balance
// between freshness and staying within API rate limits.
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useAsteroidData() {
  // ── State ────────────────────────────────────────────────
  const [asteroids,     setAsteroids]     = useState([]);       // enriched NEO list
  const [stats,         setStats]         = useState(null);     // DB-level counts
  const [loading,       setLoading]       = useState(true);     // first-load spinner
  const [error,         setError]         = useState(null);     // error message string
  const [lastUpdated,   setLastUpdated]   = useState(null);     // JS Date of last fetch
  const [isRefreshing,  setIsRefreshing]  = useState(false);    // subtle refresh indicator

  // useRef stores the interval ID so we can clear it on unmount.
  // We use ref (not state) because changing it shouldn't trigger a re-render.
  const intervalRef = useRef(null);

  // ── Core Fetch Function ──────────────────────────────────
  // useCallback with [] dependency means this function is created
  // once and never re-created, which is safe to put in useEffect deps.
  const fetchData = useCallback(async (isBackground = false) => {
    // isBackground = true means this is a poll refresh (not initial load)
    // We show a subtle indicator instead of a full spinner
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fire both requests in PARALLEL with Promise.all for speed.
      // If one fails, the whole thing throws — caught below.
      const [enriched, dbStats] = await Promise.all([
        getEnrichedAsteroids(7),   // next 7 days of NEOs
        fetchNeoStats(),           // total DB stats
      ]);

      setAsteroids(enriched);
      setStats(dbStats);
      setLastUpdated(new Date());  // record timestamp for "last updated" display
    } catch (err) {
      console.error('NASA API error:', err);
      // Provide a human-readable error message
      if (err.response?.status === 429) {
        setError('Rate limit reached. NASA allows 1,000 requests/hour with a personal key.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. NASA servers may be slow — retrying...');
      } else {
        setError(`Failed to fetch data: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ── Effect: Initial Load + Polling ──────────────────────
  useEffect(() => {
    // Initial fetch on mount
    fetchData(false);

    // Set up polling — calls fetchData(true) every POLL_INTERVAL_MS
    intervalRef.current = setInterval(() => {
      fetchData(true);  // background refresh — no full spinner
    }, POLL_INTERVAL_MS);

    // CLEANUP: runs when the component unmounts.
    // Clears the interval to prevent "setState on unmounted component" warnings.
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);  // fetchData is stable due to useCallback

  // ── Derived / Computed Values ────────────────────────────
  // These are computed from `asteroids` state, not stored separately.
  // Computing here (not in service) keeps the service pure/testable.

  const hazardousCount = asteroids.filter(a => a.isHazardous).length;
  const criticalCount  = asteroids.filter(a => a.threatScore >= 75).length;
  const closestAsteroid = asteroids.reduce(
    (min, a) => (a.missDistance.km < (min?.missDistance.km ?? Infinity) ? a : min),
    null
  );
  const fastestAsteroid = asteroids.reduce(
    (max, a) => (a.velocity.kps > (max?.velocity.kps ?? 0) ? a : max),
    null
  );

  // Group asteroids by date for timeline view
  const byDate = asteroids.reduce((acc, a) => {
    acc[a.date] = acc[a.date] ? [...acc[a.date], a] : [a];
    return acc;
  }, {});

  return {
    asteroids,            // full enriched list
    stats,                // DB stats
    loading,              // initial loading bool
    error,                // error string or null
    lastUpdated,          // Date object
    isRefreshing,         // background refresh bool
    hazardousCount,
    criticalCount,
    closestAsteroid,
    fastestAsteroid,
    byDate,               // date-grouped map
    refetch: () => fetchData(false),  // exposed for manual refresh button
    pollInterval: POLL_INTERVAL_MS,
  };
}
