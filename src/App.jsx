// ============================================================
// src/App.jsx
// ============================================================
// Root application component. This is the top-level orchestrator:
//  - Imports the custom hook (all data logic lives there)
//  - Manages selected asteroid state
//  - Composes all UI components into the dashboard layout
//  - Handles loading and error states
//
// CONCEPTS:
//  - Lifting state: selectedAsteroid lives here so both the list
//    (which sets it) and the detail panel (which reads it) can share it
//  - Composition: App is a "container" component that doesn't render
//    much HTML itself — it connects data to presentational components
//  - Framer Motion layout: AnimatePresence wraps the main layout so
//    components animate in/out smoothly
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAsteroidData } from './hooks/useAsteroidData';

import Header       from './components/Header';
import AlertTicker  from './components/AlertTicker';
import StatsBar     from './components/StatsBar';
import AsteroidList from './components/AsteroidList';
import AsteroidDetail from './components/AsteroidDetail';
import OrbitalView  from './components/OrbitalView';
import ThreatCharts from './components/ThreatChart';

import './styles/global.css';

// ── Loading Screen ─────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div style={{ position: 'relative' }}>
        {/* Outer ring */}
        <div style={{
          width: 80, height: 80,
          border: '3px solid #F1ECE2',
          borderTop: '3px solid #E08A2C',
          borderRadius: '50%',
          animation: 'rotate-orbit 1.2s linear infinite',
        }} />
        {/* Inner ring */}
        <div style={{
          position: 'absolute', inset: 12,
          border: '2px solid #F1ECE2',
          borderBottom: '2px solid #1D7A78',
          borderRadius: '50%',
          animation: 'rotate-orbit 0.8s linear infinite reverse',
        }} />
        {/* Center icon */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          ☄
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: '#1F2A37',
          marginBottom: 8,
        }}>
          Initializing Surveillance
        </div>
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11,
          color: '#98A2B0',
        }}>
          Querying NASA NeoWs API…
        </div>
      </div>

      {/* Fake progress steps */}
      {['Connecting to NASA NeoWs API', 'Fetching near-Earth objects', 'Computing threat scores', 'Rendering orbital paths'].map((step, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.4 + 0.5 }}
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
            color: '#98A2B0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <motion.span
            initial={{ color: '#98A2B0' }}
            animate={{ color: '#2F9E5B' }}
            transition={{ delay: i * 0.4 + 1.0 }}
          >
            ✓
          </motion.span>
          {step}
        </motion.div>
      ))}
    </div>
  );
}

// ── Error Screen ───────────────────────────────────────────
function ErrorScreen({ message, onRetry }) {
  return (
    <div className="loading-screen">
      <div style={{ fontSize: 48 }}>⚠</div>
      <div style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 18,
        fontWeight: 700,
        color: '#D33A3A',
        textAlign: 'center',
        maxWidth: 400,
      }}>
        Data Feed Interrupted
      </div>
      <div style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 12,
        color: '#5B6878',
        textAlign: 'center',
        maxWidth: 440,
        lineHeight: 1.7,
      }}>
        {message}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        style={{
          background: '#FBE7CC',
          border: '1px solid #E08A2C',
          color: '#B5651D',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '10px 24px',
          borderRadius: 6,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        RETRY CONNECTION
      </motion.button>
      <div style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10,
        color: '#98A2B0',
        marginTop: 8,
      }}>
        Tip: Get a free API key at api.nasa.gov to avoid rate limits
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────
export default function App() {
  const {
    asteroids, stats, loading, error,
    lastUpdated, isRefreshing,
    hazardousCount, criticalCount,
    closestAsteroid, fastestAsteroid,
    byDate, refetch, pollInterval,
  } = useAsteroidData();

  // Which asteroid is highlighted/selected
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  // Which tab is active in the main content area
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orbital' | 'charts'

  // ── Tab switching ────────────────────────────────────────
  const TABS = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'orbital',  label: '3D ORBITAL' },
    { id: 'charts',   label: 'ANALYTICS' },
  ];

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} onRetry={refetch} />;

  return (
    <div className="app-shell">
      {/* ── Sticky Header ─────────────────────────────── */}
      <Header
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        criticalCount={criticalCount}
        totalCount={asteroids.length}
        onRefresh={refetch}
        pollInterval={pollInterval}
      />

      {/* ── Alert Ticker ──────────────────────────────── */}
      <AlertTicker asteroids={asteroids} />

      {/* ── Stats Bar ─────────────────────────────────── */}
      <div style={{ padding: '12px 16px 4px' }}>
        <StatsBar
          asteroids={asteroids}
          hazardousCount={hazardousCount}
          criticalCount={criticalCount}
          closestAsteroid={closestAsteroid}
          fastestAsteroid={fastestAsteroid}
        />
      </div>

      {/* ── Tab Nav ───────────────────────────────────── */}
      <div style={{
        padding: '8px 16px 0',
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid #E4DDCE',
        marginLeft: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#E08A2C' : 'transparent'}`,
              color: activeTab === tab.id ? '#B5651D' : '#98A2B0',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '8px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 12,
        padding: '12px 16px 16px',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* LEFT SIDEBAR: Always-visible asteroid list */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <AsteroidList
            asteroids={asteroids}
            selectedId={selectedAsteroid?.id}
            onSelect={setSelectedAsteroid}
          />
        </div>

        {/* RIGHT MAIN PANEL: Switches by tab */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}
              >
                <AsteroidDetail
                  asteroid={selectedAsteroid}
                  onClose={() => setSelectedAsteroid(null)}
                />
              </motion.div>
            )}

            {activeTab === 'orbital' && (
              <motion.div
                key="orbital"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <OrbitalView
                  asteroids={asteroids}
                  selectedId={selectedAsteroid?.id}
                  onSelect={setSelectedAsteroid}
                />
              </motion.div>
            )}

            {activeTab === 'charts' && (
              <motion.div
                key="charts"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ flex: 1, overflowY: 'auto' }}
              >
                <ThreatCharts asteroids={asteroids} byDate={byDate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div style={{
        padding: '8px 24px',
        borderTop: '1px solid #F1ECE2',
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10,
        color: '#98A2B0',
      }}>
        <span>
          Data source:{' '}
          <a
            href="https://api.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1D7A78', textDecoration: 'none', fontWeight: 600 }}
          >
            NASA NeoWs API
          </a>
          {' '}· Threat scores are computational estimates, not official NASA hazard ratings
        </span>
        <span>Auto-refresh every 5 min · {asteroids.length} NEOs tracked (7-day window)</span>
      </div>
    </div>
  );
}