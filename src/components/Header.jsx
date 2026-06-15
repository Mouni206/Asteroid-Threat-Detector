// ============================================================
// src/components/Header.jsx
// ============================================================
// The top control-room bar, re-themed for the "Solar Observatory"
// light palette. Shows:
//  - Mission title in Fraunces (display serif) for character
//  - Live/Refreshing status indicator
//  - Last updated timestamp
//  - Critical alert count badge
//  - Manual refresh button
//
// CONCEPTS:
//  - date-fns format(): converts JS Date to readable strings
//  - framer-motion AnimatePresence: mounts/unmounts with animation
//  - Conditional rendering: shows different states (loading, error, ok)
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function Header({
  lastUpdated,
  isRefreshing,
  criticalCount,
  totalCount,
  onRefresh,
  pollInterval,
}) {
  // Format poll interval into human-readable string (e.g. "5 min")
  const intervalMin = Math.round(pollInterval / 60000);

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E4DDCE',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* LEFT: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Animated orbit icon */}
        <div style={{ position: 'relative', width: 36, height: 36 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0,
              border: '1.5px solid #E08A2C',
              borderRadius: '50%',
              borderTopColor: 'transparent',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 6,
              border: '1.5px solid #1D7A78',
              borderRadius: '50%',
              borderBottomColor: 'transparent',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>
            ☄
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: '#1F2A37',
            lineHeight: 1,
          }}>
            Asteroid Watch
          </div>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: '#98A2B0',
            marginTop: 4,
            textTransform: 'uppercase',
          }}>
            Near Earth Object Observatory
          </div>
        </div>
      </div>

      {/* CENTER: Status bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 11,
      }}>
        {/* Live / Refreshing indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AnimatePresence mode="wait">
            {isRefreshing ? (
              <motion.div
                key="refreshing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  border: '2px solid #1D7A78',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <motion.div
                key="live"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="live-dot"
              />
            )}
          </AnimatePresence>
          <span style={{ color: isRefreshing ? '#1D7A78' : '#2F9E5B', fontWeight: 600 }}>
            {isRefreshing ? 'SYNCING' : 'LIVE'}
          </span>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div style={{ color: '#98A2B0' }}>
            <span style={{ color: '#5B6878' }}>UPDATED </span>
            {format(lastUpdated, 'HH:mm:ss')}
          </div>
        )}

        {/* Auto-refresh period */}
        <div style={{ color: '#98A2B0' }}>
          POLL <span style={{ color: '#5B6878' }}>{intervalMin}MIN</span>
        </div>

        {/* Total tracked */}
        {totalCount > 0 && (
          <div style={{ color: '#98A2B0' }}>
            TRACKING <span style={{ color: '#1D7A78', fontWeight: 600 }}>{totalCount}</span> NEOs
          </div>
        )}
      </div>

      {/* RIGHT: Critical alert + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Critical count badge */}
        <AnimatePresence>
          {criticalCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                background: '#FBDEDE',
                border: '1px solid #D33A3A',
                borderRadius: 6,
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                color: '#D33A3A',
                animation: 'blink-alert 2s infinite',
              }}
            >
              <span>⚠</span>
              <span>{criticalCount} CRITICAL</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual refresh button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onRefresh}
          style={{
            background: '#FBE7CC',
            border: '1px solid #E08A2C',
            color: '#B5651D',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            padding: '7px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.target.style.background = '#E08A2C';
            e.target.style.color = '#FFFFFF';
          }}
          onMouseLeave={e => {
            e.target.style.background = '#FBE7CC';
            e.target.style.color = '#B5651D';
          }}
        >
          ↻ Refresh
        </motion.button>
      </div>
    </header>
  );
}