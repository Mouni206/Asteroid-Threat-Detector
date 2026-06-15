// ============================================================
// src/services/nasaApi.js
// ============================================================
// This is the DATA LAYER of the app — it handles ALL communication
// with NASA's NeoWs (Near Earth Object Web Service) REST API.
//
// KEY CONCEPTS USED:
//  - axios: HTTP client library (cleaner than fetch, auto JSON parse)
//  - async/await: modern JavaScript for handling asynchronous operations
//  - NASA NeoWs API: https://api.nasa.gov/neo/rest/v1
//    - /feed     → asteroids approaching Earth in a date range
//    - /neo/{id} → single asteroid full detail
//    - /stats    → overall database stats
//  - Error handling: try/catch so the UI never crashes on bad network
// ============================================================

import axios from 'axios';
import { format, addDays, subDays } from 'date-fns';

// NASA's NeoWs base URL
const BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

// Read API key from .env file — NEVER hardcode API keys in source code
const API_KEY = process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY';

// ─── AXIOS INSTANCE ──────────────────────────────────────────
// We create a pre-configured axios instance so every request
// automatically includes the base URL and API key as a query param.
const nasaClient = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },   // appended to every request URL
  timeout: 15000,                  // 15s timeout — fail fast if NASA is slow
});

// ─── DATE HELPERS ─────────────────────────────────────────────
// NASA's NeoWs API expects dates in 'YYYY-MM-DD' format
// date-fns format() converts JS Date objects to strings cleanly
export const getTodayStr  = () => format(new Date(), 'yyyy-MM-dd');
export const getYesterdayStr = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');
export const getFutureDateStr = (days) => format(addDays(new Date(), days), 'yyyy-MM-dd');

// ─── THREAT SCORING ───────────────────────────────────────────
// NASA provides "is_potentially_hazardous_asteroid" boolean
// but we compute a richer 0–100 threat score for the dashboard.
//
// The formula weighs three factors:
//  1. Miss distance   — closer = more threatening (km from Earth)
//  2. Relative velocity — faster = harder to deflect (km/s)
//  3. Diameter        — larger = more destructive (km)
//
// Each factor is normalized to 0–33.3 points, summed to 0–100.
export function computeThreatScore(asteroid) {
  try {
    const approach = asteroid.close_approach_data?.[0];
    if (!approach) return 0;

    const missKm   = parseFloat(approach.miss_distance?.kilometers || 99999999);
    const velKms   = parseFloat(approach.relative_velocity?.kilometers_per_second || 0);
    const diam     = asteroid.estimated_diameter?.kilometers?.estimated_diameter_max || 0;

    // Normalize each factor to 0-33.3 range
    // MAX_MISS = 7,500,000 km (about 20× Moon distance — anything closer matters)
    const MAX_MISS = 7_500_000;
    const distScore = Math.max(0, (1 - missKm / MAX_MISS) * 33.3);

    // MAX_VEL = 30 km/s (typical upper bound for NEOs)
    const MAX_VEL  = 30;
    const velScore = Math.min((velKms / MAX_VEL) * 33.3, 33.3);

    // MAX_DIAM = 2 km (Chicxulub impactor was ~10km — 2km is already extinction-level)
    const MAX_DIAM = 2;
    const sizeScore = Math.min((diam / MAX_DIAM) * 33.3, 33.3);

    return Math.min(Math.round(distScore + velScore + sizeScore), 100);
  } catch {
    return 0;
  }
}

// ─── THREAT LEVEL LABEL ───────────────────────────────────────
export function getThreatLevel(score) {
  if (score >= 75) return { label: 'CRITICAL', color: '#D33A3A', glow: '#FBDEDE' };
  if (score >= 50) return { label: 'HIGH',     color: '#E0682C', glow: '#FBE2D4' };
  if (score >= 25) return { label: 'MODERATE', color: '#D89A1B', glow: '#FBF0D2' };
  return               { label: 'LOW',         color: '#2F9E5B', glow: '#DCF3E5' };
}

// ─── API CALL 1: FEED (date range, max 7 days per NASA limit) ─
// Returns raw NASA response with near-Earth objects grouped by date.
export async function fetchAsteroidFeed(startDate, endDate) {
  const response = await nasaClient.get('/feed', {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
}

// ─── API CALL 2: SINGLE ASTEROID DETAIL ───────────────────────
export async function fetchAsteroidDetail(neoId) {
  const response = await nasaClient.get(`/neo/${neoId}`);
  return response.data;
}

// ─── API CALL 3: DATABASE STATS ───────────────────────────────
export async function fetchNeoStats() {
  const response = await nasaClient.get('/neo/browse', {
    params: { page: 0, size: 1 }  // we only need the total count in page metadata
  });
  return response.data.page;
}

// ─── MAIN DATA PROCESSOR ──────────────────────────────────────
// This function:
//  1. Fetches the NEO feed for today + 7 days
//  2. Flattens the nested date-grouped response into a flat array
//  3. Enriches each object with our threat score and level
//  4. Returns a clean, normalized array the UI components can use
//
// NASA response shape:
// {
//   near_earth_objects: {
//     "2024-01-15": [ {...asteroid}, {...asteroid} ],
//     "2024-01-16": [ {...asteroid} ],
//     ...
//   }
// }
export async function getEnrichedAsteroids(daysAhead = 7) {
  const start = getTodayStr();
  const end   = getFutureDateStr(daysAhead);

  const raw  = await fetchAsteroidFeed(start, end);
  const neos = raw.near_earth_objects;

  // Flatten: iterate over each date key, concat all asteroid arrays
  const flat = Object.entries(neos).flatMap(([date, asteroids]) =>
    asteroids.map(ast => {
      const score = computeThreatScore(ast);
      const level = getThreatLevel(score);
      const approach = ast.close_approach_data?.[0] || {};

      return {
        id:            ast.id,
        name:          ast.name.replace(/[()]/g, '').trim(),  // strip parens from names
        date:          date,
        threatScore:   score,
        threatLevel:   level,
        isHazardous:   ast.is_potentially_hazardous_asteroid,
        diameter: {
          minKm: ast.estimated_diameter?.kilometers?.estimated_diameter_min ?? 0,
          maxKm: ast.estimated_diameter?.kilometers?.estimated_diameter_max ?? 0,
          minM:  ast.estimated_diameter?.meters?.estimated_diameter_min ?? 0,
          maxM:  ast.estimated_diameter?.meters?.estimated_diameter_max ?? 0,
        },
        velocity: {
          kph:   parseFloat(approach.relative_velocity?.kilometers_per_hour || 0),
          kps:   parseFloat(approach.relative_velocity?.kilometers_per_second || 0),
        },
        missDistance: {
          km:     parseFloat(approach.miss_distance?.kilometers || 0),
          lunar:  parseFloat(approach.miss_distance?.lunar || 0),
          au:     parseFloat(approach.miss_distance?.astronomical || 0),
        },
        orbitingBody:  approach.orbiting_body || 'Earth',
        nasaUrl:       ast.nasa_jpl_url,
        absoluteMag:   ast.absolute_magnitude_h,
      };
    })
  );

  // Sort by threat score descending so most dangerous appear first
  return flat.sort((a, b) => b.threatScore - a.threatScore);
}