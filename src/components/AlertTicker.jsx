// ============================================================
// src/components/AlertTicker.jsx
// ============================================================
// A scrolling ticker bar at the top of the dashboard that
// cycles through critical and hazardous asteroids.
// Like a news ticker — creates urgency and always shows
// the most threatening objects at a glance.
//
// CONCEPTS:
//  - useEffect with setInterval: auto-advance ticker index every 4s
//  - CSS marquee-style animation using framer-motion AnimatePresence
//  - Conditional rendering: only shows if hazardous count > 0
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export default function AlertTicker({ asteroids }) {
  const [index, setIndex] = useState(0);

  // Filter to only the notable ones
  const notable = asteroids.filter(a => a.isHazardous || a.threatScore >= 40);

  useEffect(() => {
    if (notable.length <= 1) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % notable.length);
    }, 4000);
    return () => clearInterval(id);
  }, [notable.length]);

  if (notable.length === 0) return null;

  const ast = notable[index % notable.length];
  const isCritical = ast.threatScore >= 75;

  return (
    <div style={{
      background: isCritical
        ? 'linear-gradient(90deg, #FBDEDE, #FEF4F4, #FBDEDE)'
        : 'linear-gradient(90deg, #FBF0D2, #FEFAF0, #FBF0D2)',
      borderBottom: `1px solid ${isCritical ? '#F2BFBF' : '#F0DFA8'}`,
      padding: '7px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      overflow: 'hidden',
      minHeight: 36,
    }}>
      {/* ALERT prefix */}
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        color: isCritical ? '#D33A3A' : '#D89A1B',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isCritical ? '#D33A3A' : '#D89A1B',
          animation: 'blink-alert 1s infinite',
        }} />
        {isCritical ? '⚠ CRITICAL ALERT' : '⚡ HAZARDOUS NEO'}
      </div>

      <div style={{
        width: 1, height: 20,
        background: isCritical ? '#F2BFBF' : '#F0DFA8',
        flexShrink: 0,
      }} />

      {/* Animated ticker content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={ast.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11,
            flex: 1,
          }}
        >
          <span style={{ color: '#1F2A37', fontWeight: 600 }}>
            {ast.name}
          </span>
          <span style={{ color: '#C9BFA8' }}>|</span>
          <span style={{ color: '#5B6878' }}>
            APPROACH: <span style={{ color: isCritical ? '#D33A3A' : '#D89A1B', fontWeight: 600 }}>
              {format(parseISO(ast.date), 'MMM dd, yyyy')}
            </span>
          </span>
          <span style={{ color: '#C9BFA8' }}>|</span>
          <span style={{ color: '#5B6878' }}>
            MISS DIST: <span style={{ color: '#E0682C', fontWeight: 600 }}>
              {ast.missDistance.lunar.toFixed(2)} LD
            </span>
          </span>
          <span style={{ color: '#C9BFA8' }}>|</span>
          <span style={{ color: '#5B6878' }}>
            VELOCITY: <span style={{ color: '#1D7A78', fontWeight: 600 }}>
              {Math.round(ast.velocity.kps)} km/s
            </span>
          </span>
          <span style={{ color: '#C9BFA8' }}>|</span>
          <span style={{ color: '#5B6878' }}>
            THREAT: <span style={{
              color: ast.threatLevel.color,
              fontWeight: 700,
            }}>
              {ast.threatScore}/100
            </span>
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Index counter */}
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 9,
        fontWeight: 600,
        color: '#98A2B0',
        flexShrink: 0,
      }}>
        {(index % notable.length) + 1}/{notable.length}
      </div>
    </div>
  );
}