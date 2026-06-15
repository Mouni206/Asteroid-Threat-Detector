// ============================================================
// src/components/AsteroidDetail.jsx
// ============================================================
// Full detail panel shown when the user clicks an asteroid row.
// Shows all enriched data: orbit info, threat analysis, velocity,
// size comparison, close approach timeline, and a direct NASA link.
//
// CONCEPTS:
//  - Framer Motion layoutId: enables shared element transition —
//    the card "morphs" from the list row into the detail panel
//  - Conditional rendering with null guard
//  - Data normalization for display (large numbers, units)
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// ── Circular Threat Gauge ─────────────────────────────────
// SVG-based circular progress gauge showing threat score.
// We calculate SVG stroke-dashoffset to fill the arc proportionally.
function ThreatGauge({ score, color }) {
  const RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const fillRatio = score / 100;
  const strokeDash = CIRCUMFERENCE * fillRatio;
  const strokeGap  = CIRCUMFERENCE - strokeDash;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="70" cy="70" r={RADIUS} fill="none"
          stroke="#F1ECE2" strokeWidth="8" />
        {/* Fill */}
        <motion.circle
          cx="70" cy="70" r={RADIUS} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
          animate={{ strokeDasharray: `${strokeDash} ${strokeGap}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 32,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </motion.div>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.16em',
          color: '#98A2B0',
          marginTop: 4,
        }}>
          THREAT SCORE
        </div>
      </div>
    </div>
  );
}

// ── Data Row ─────────────────────────────────────────────
function DataRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '7px 0',
      borderBottom: '1px solid #F1ECE2',
    }}>
      <span style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.1em',
        color: '#98A2B0',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 12,
        color: highlight || '#1F2A37',
        fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Size Comparison Bar ───────────────────────────────────
// Visually compares asteroid diameter to recognizable objects
function SizeComparison({ diameterM }) {
  const references = [
    { name: 'Car (5m)',         size: 5 },
    { name: 'Airbus A380 (73m)', size: 73 },
    { name: 'Eiffel Tower (330m)', size: 330 },
    { name: 'Burj Khalifa (830m)', size: 830 },
    { name: 'Chicxulub (10km)', size: 10000 },
  ];

  const avgDiam = diameterM;
  const maxRef  = references[references.length - 1].size;

  return (
    <div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: '#98A2B0',
        marginBottom: 10,
        textTransform: 'uppercase',
      }}>
        Size Comparison
      </div>
      {/* Asteroid itself */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#1D7A78', fontWeight: 600 }}>
            This asteroid (~{avgDiam < 1000 ? `${Math.round(avgDiam)}m` : `${(avgDiam/1000).toFixed(1)}km`})
          </span>
        </div>
        <div className="threat-bar-track">
          <motion.div
            className="threat-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((avgDiam / maxRef) * 100, 100)}%` }}
            transition={{ duration: 1 }}
            style={{ background: '#1D7A78' }}
          />
        </div>
      </div>
      {references.map(ref => (
        <div key={ref.name} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#98A2B0' }}>
              {ref.name}
            </span>
          </div>
          <div className="threat-bar-track">
            <div className="threat-bar-fill" style={{
              width: `${(ref.size / maxRef) * 100}%`,
              background: '#E4DDCE',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Detail Panel ─────────────────────────────────────
export default function AsteroidDetail({ asteroid, onClose }) {
  if (!asteroid) {
    return (
      <div className="glass-panel" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        color: '#98A2B0',
        minHeight: 400,
      }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>☄</div>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
          Select an object to inspect
        </div>
      </div>
    );
  }

  const { threatLevel, threatScore } = asteroid;

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: 0, overflow: 'hidden', flex: 1 }}
    >
      {/* Header with close */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #F1ECE2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${threatLevel.color}10 0%, transparent 100%)`,
      }}>
        <div>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: '#98A2B0',
            marginBottom: 4,
            textTransform: 'uppercase',
          }}>
            Near Earth Object · ID {asteroid.id}
          </div>
          <div style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 22,
            fontWeight: 700,
            color: '#1F2A37',
          }}>
            {asteroid.name}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {asteroid.isHazardous && (
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              padding: '5px 12px',
              background: '#FBDEDE',
              border: '1px solid #D33A3A',
              color: '#D33A3A',
              borderRadius: 5,
              letterSpacing: '0.06em',
              animation: 'blink-alert 2s infinite',
            }}>
              ⚠ POTENTIALLY HAZARDOUS
            </span>
          )}
          <button onClick={onClose} style={{
            background: 'transparent',
            border: '1px solid #E4DDCE',
            color: '#5B6878',
            fontSize: 18,
            cursor: 'pointer',
            padding: '2px 10px',
            borderRadius: 6,
            lineHeight: 1,
          }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
        {/* Top section: gauge + key data */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <ThreatGauge score={threatScore} color={threatLevel.color} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <DataRow label="Threat Level"
              value={threatLevel.label}
              highlight={threatLevel.color} />
            <DataRow label="Close Approach"
              value={format(parseISO(asteroid.date), 'MMMM dd, yyyy')} />
            <DataRow label="Miss Distance"
              value={`${(asteroid.missDistance.km / 1000).toFixed(0)}k km`}
              highlight="#FF6B00" />
            <DataRow label="Lunar Distance"
              value={`${asteroid.missDistance.lunar.toFixed(3)} LD`} />
            <DataRow label="Astronomical Unit"
              value={`${asteroid.missDistance.au.toFixed(5)} AU`} />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <DataRow label="Relative Velocity"
              value={`${asteroid.velocity.kps.toFixed(2)} km/s`}
              highlight="#00F5FF" />
            <DataRow label="Velocity (km/h)"
              value={`${Math.round(asteroid.velocity.kph).toLocaleString()} km/h`} />
            <DataRow label="Diameter (min)"
              value={`${asteroid.diameter.minM.toFixed(0)} m`} />
            <DataRow label="Diameter (max)"
              value={`${asteroid.diameter.maxM.toFixed(0)} m`}
              highlight="#FFD700" />
            <DataRow label="Absolute Magnitude"
              value={`H = ${asteroid.absoluteMag}`} />
          </div>
        </div>

        {/* Size comparison */}
        <div style={{
          background: '#FAF7F1',
          border: '1px solid #F1ECE2',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}>
          <SizeComparison diameterM={(asteroid.diameter.minM + asteroid.diameter.maxM) / 2} />
        </div>

        {/* NASA Link */}
        <a
          href={asteroid.nasaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 20px',
            background: '#DCEFEE',
            border: '1px solid #1D7A78',
            borderRadius: 6,
            color: '#1D7A78',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1D7A78'; e.currentTarget.style.color = '#FFFFFF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#DCEFEE'; e.currentTarget.style.color = '#1D7A78'; }}
        >
          🔗 VIEW ON NASA JPL DATABASE
        </a>
      </div>
    </motion.div>
  );
}