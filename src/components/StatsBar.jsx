// ============================================================
// src/components/StatsBar.jsx
// ============================================================
// The top-row KPI (Key Performance Indicator) strip.
// Shows 5 critical numbers at a glance.
//
// CONCEPTS:
//  - useEffect with count-up animation: smooth number increments
//    from 0 to target using requestAnimationFrame for 60fps smoothness
//  - formatNumber: locale-aware number formatting (1000 → "1,000")
//  - Conditional colors: stat card changes color based on severity
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ── Animated Counter Hook ─────────────────────────────────
// Animates from 0 to `target` over `duration` ms using rAF.
// Returns the current displayed value.
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === 0 || target == null) { setValue(0); return; }
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: decelerates towards end for natural feel
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, unit, color, icon, sublabel, delay = 0 }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);

  const displayValue = typeof value === 'number'
    ? animated.toLocaleString()
    : value ?? '—';

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ padding: '16px 20px', flex: 1, minWidth: 140 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1,
            color: color || '#1F2A37',
          }}>
            {displayValue}
            {unit && (
              <span style={{ fontSize: 13, marginLeft: 4, color: '#98A2B0', fontWeight: 400 }}>
                {unit}
              </span>
            )}
          </div>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            color: '#98A2B0',
            textTransform: 'uppercase',
            marginTop: 8,
          }}>
            {label}
          </div>
          {sublabel && (
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              color: '#5B6878',
              marginTop: 3,
            }}>
              {sublabel}
            </div>
          )}
        </div>
        <div style={{ fontSize: 20, opacity: 0.5 }}>{icon}</div>
      </div>
    </motion.div>
  );
}

// ── Main StatsBar ──────────────────────────────────────────
export default function StatsBar({ asteroids, hazardousCount, criticalCount, closestAsteroid, fastestAsteroid }) {
  // Format miss distance to readable scale
  const closestKm = closestAsteroid?.missDistance.km;
  const closestDisplay = closestKm
    ? closestKm < 1_000_000
      ? `${Math.round(closestKm / 1000)}k km`
      : `${(closestKm / 1_000_000).toFixed(2)}M km`
    : '—';

  const fastestKps = fastestAsteroid?.velocity.kps;

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '0 16px',
      overflowX: 'auto',
      flexWrap: 'wrap',
    }}>
      <StatCard
        label="Tracked NEOs"
        value={asteroids.length}
        icon="🛰"
        color="#1D7A78"
        delay={0}
      />
      <StatCard
        label="Potentially Hazardous"
        value={hazardousCount}
        icon="⚠"
        color={hazardousCount > 0 ? '#D89A1B' : '#2F9E5B'}
        delay={0.05}
      />
      <StatCard
        label="Critical Threat"
        value={criticalCount}
        icon="🔴"
        color={criticalCount > 0 ? '#D33A3A' : '#2F9E5B'}
        delay={0.1}
      />
      <StatCard
        label="Closest Approach"
        value={closestDisplay}
        icon="📡"
        color="#E0682C"
        sublabel={closestAsteroid?.name?.slice(0, 20) ?? ''}
        delay={0.15}
      />
      <StatCard
        label="Fastest Velocity"
        value={fastestKps ? Math.round(fastestKps) : null}
        unit="km/s"
        icon="⚡"
        color="#1D7A78"
        sublabel={fastestAsteroid?.name?.slice(0, 20) ?? ''}
        delay={0.2}
      />
    </div>
  );
}