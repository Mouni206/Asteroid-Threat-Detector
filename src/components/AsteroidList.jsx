// ============================================================
// src/components/AsteroidList.jsx
// ============================================================
// Scrollable sidebar list of all tracked asteroids.
// Features:
//  - Filter by threat level (ALL / HAZARDOUS / CRITICAL)
//  - Sort by threat score, miss distance, or velocity
//  - Color-coded threat level badges
//  - Click to select → shows detail panel
//  - Animated entry with staggered framer-motion list items
//
// CONCEPTS:
//  - useMemo: expensive filter+sort only re-runs when deps change
//  - Array.filter + Array.sort: functional data transforms
//  - Controlled state: filter/sort state lives here, lifted to App
// ============================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// ── Threat Badge ──────────────────────────────────────────
function ThreatBadge({ level }) {
  const colors = {
    CRITICAL: { bg: '#FBDEDE', border: '#D33A3A', text: '#D33A3A' },
    HIGH:     { bg: '#FBE2D4', border: '#E0682C', text: '#E0682C' },
    MODERATE: { bg: '#FBF0D2', border: '#D89A1B', text: '#D89A1B' },
    LOW:      { bg: '#DCF3E5', border: '#2F9E5B', text: '#2F9E5B' },
  };
  const c = colors[level] || colors.LOW;
  return (
    <span style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.06em',
      padding: '2px 7px',
      borderRadius: 4,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      whiteSpace: 'nowrap',
    }}>
      {level}
    </span>
  );
}

// ── Single Row ────────────────────────────────────────────
function AsteroidRow({ asteroid, isSelected, onClick, index }) {
  const isCritical = asteroid.threatScore >= 75;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={() => onClick(asteroid)}
      className={isCritical ? 'threat-pulse' : ''}
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid #F1ECE2',
        cursor: 'pointer',
        background: isSelected
          ? '#FBE7CC'
          : isCritical
            ? '#FBDEDE'
            : 'transparent',
        borderLeft: isSelected
          ? '3px solid #E08A2C'
          : isCritical
            ? '3px solid #D33A3A'
            : '3px solid transparent',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#F1ECE2')}
      onMouseLeave={e => !isSelected && (e.currentTarget.style.background = isCritical ? '#FBDEDE' : 'transparent')}
    >
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 12,
          fontWeight: 500,
          color: isSelected ? '#B5651D' : '#1F2A37',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 160,
        }}>
          {asteroid.name}
        </span>
        <ThreatBadge level={asteroid.threatLevel.label} />
      </div>

      {/* Threat score bar */}
      <div className="threat-bar-track" style={{ marginBottom: 6 }}>
        <motion.div
          className="threat-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${asteroid.threatScore}%` }}
          transition={{ duration: 0.8, delay: index * 0.03 }}
          style={{ background: asteroid.threatLevel.color }}
        />
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10,
        color: '#5B6878',
      }}>
        <span>
          📏 {asteroid.missDistance.lunar.toFixed(1)} LD
        </span>
        <span>
          ⚡ {Math.round(asteroid.velocity.kps)} km/s
        </span>
        <span style={{ color: '#98A2B0' }}>
          {format(parseISO(asteroid.date), 'MMM dd')}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main AsteroidList ─────────────────────────────────────
const FILTERS = ['ALL', 'HAZARDOUS', 'CRITICAL'];
const SORTS   = [
  { key: 'threat',    label: 'THREAT' },
  { key: 'distance',  label: 'DISTANCE' },
  { key: 'velocity',  label: 'VELOCITY' },
  { key: 'date',      label: 'DATE' },
];

export default function AsteroidList({ asteroids, selectedId, onSelect }) {
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('threat');

  // useMemo: recompute only when asteroids/filter/sortBy change
  const filtered = useMemo(() => {
    let arr = [...asteroids];

    // Apply filter
    if (filter === 'HAZARDOUS') arr = arr.filter(a => a.isHazardous);
    if (filter === 'CRITICAL')  arr = arr.filter(a => a.threatScore >= 75);

    // Apply sort
    if (sortBy === 'threat')    arr.sort((a, b) => b.threatScore - a.threatScore);
    if (sortBy === 'distance')  arr.sort((a, b) => a.missDistance.km - b.missDistance.km);
    if (sortBy === 'velocity')  arr.sort((a, b) => b.velocity.kps - a.velocity.kps);
    if (sortBy === 'date')      arr.sort((a, b) => a.date.localeCompare(b.date));

    return arr;
  }, [asteroids, filter, sortBy]);

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Panel Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #F1ECE2',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#1F2A37',
          marginBottom: 10,
          textTransform: 'uppercase',
        }}>
          NEO Tracking List
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
            fontWeight: 400,
            color: '#98A2B0',
            float: 'right',
            letterSpacing: 0,
          }}>
            {filtered.length}/{asteroids.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#E08A2C' : 'transparent',
                border: `1px solid ${filter === f ? '#E08A2C' : '#E4DDCE'}`,
                color: filter === f ? '#FFFFFF' : '#98A2B0',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '4px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 9,
            color: '#98A2B0',
            alignSelf: 'center',
            marginRight: 4,
          }}>
            SORT:
          </span>
          {SORTS.map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              style={{
                background: 'transparent',
                border: 'none',
                color: sortBy === s.key ? '#1D7A78' : '#98A2B0',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                padding: '2px 4px',
                borderBottom: sortBy === s.key ? '1.5px solid #1D7A78' : '1.5px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="scroll-list" style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 12,
              color: '#98A2B0',
            }}>
              No objects match filter
            </div>
          ) : (
            filtered.map((ast, i) => (
              <AsteroidRow
                key={ast.id}
                asteroid={ast}
                index={i}
                isSelected={ast.id === selectedId}
                onClick={onSelect}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}