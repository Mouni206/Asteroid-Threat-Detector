// ============================================================
// src/components/ThreatChart.jsx
// ============================================================
// Data visualization panel using Recharts library.
// Shows:
//   1. Timeline Bar Chart: NEO count per day (next 7 days)
//   2. Scatter Plot: Miss distance vs. velocity (threat landscape)
//   3. Threat Distribution: pie-style breakdown by threat level
//
// CONCEPTS:
//  - Recharts: declarative React chart library built on D3 under the hood
//  - ResponsiveContainer: makes charts fill their parent flexibly
//  - useMemo: aggregate heavy computations without repeated work
//  - Custom tooltip: shows rich info on hover in charts
// ============================================================

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, CartesianGrid, ReferenceLine,
  PieChart, Pie, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

// Recharts custom styles — light theme
const AXIS_STYLE  = { fill: '#98A2B0', fontFamily: 'IBM Plex Mono', fontSize: 10 };
const GRID_STYLE  = { stroke: '#F1ECE2' };

// ── Custom Tooltip (shared) ───────────────────────────────
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E4DDCE',
      borderRadius: 6,
      padding: '10px 14px',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 11,
      boxShadow: '0 4px 16px rgba(31,42,55,0.08)',
    }}>
      {label && <div style={{ color: '#1D7A78', fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#1F2A37', marginTop: 2 }}>
          {p.name}: <strong>{formatter ? formatter(p.value, p.name) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Panel Wrapper ─────────────────────────────────────────
function ChartPanel({ title, children }) {
  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: 20, flex: 1, minWidth: 280 }}
    >
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: '#1F2A37',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        {title}
      </div>
      {children}
    </motion.div>
  );
}

// ── Chart 1: NEO Count by Date ─────────────────────────────
function DailyCountChart({ byDate }) {
  const data = useMemo(() =>
    Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, asts]) => ({
        date: format(parseISO(date), 'MMM d'),
        total: asts.length,
        hazardous: asts.filter(a => a.isHazardous).length,
        critical:  asts.filter(a => a.threatScore >= 75).length,
      })),
    [byDate]
  );

  return (
    <ChartPanel title="Daily NEO Approach Count">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="2 4" {...GRID_STYLE} />
          <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={24} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total"     name="Total"    fill="#DCEFEE"  radius={[2,2,0,0]} />
          <Bar dataKey="hazardous" name="Hazardous" fill="#FBF0D2"  radius={[2,2,0,0]} />
          <Bar dataKey="critical"  name="Critical"  fill="#D33A3A"   radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

// ── Chart 2: Scatter — Distance vs. Velocity ──────────────
function ThreatScatterChart({ asteroids }) {
  const data = useMemo(() =>
    asteroids.map(a => ({
      x: a.missDistance.lunar,    // Lunar distances on X
      y: a.velocity.kps,          // Velocity (km/s) on Y
      z: a.diameter.maxM,         // Diameter (m) for circle size
      name: a.name,
      color: a.threatLevel.color,
      score: a.threatScore,
    })),
    [asteroids]
  );

  return (
    <ChartPanel title="Distance vs. Velocity Landscape">
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="2 4" {...GRID_STYLE} />
          <XAxis
            dataKey="x" name="Lunar Distance"
            tick={AXIS_STYLE} axisLine={false} tickLine={false}
            label={{ value: 'Lunar Dist.', fill: '#98A2B0', fontSize: 9, position: 'insideBottom', offset: -2 }}
          />
          <YAxis
            dataKey="y" name="Velocity (km/s)"
            tick={AXIS_STYLE} axisLine={false} tickLine={false} width={28}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#1D7A78' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E4DDCE',
                  borderRadius: 6, padding: '8px 12px',
                  fontFamily: 'IBM Plex Mono', fontSize: 10,
                  boxShadow: '0 4px 16px rgba(31,42,55,0.08)',
                }}>
                  <div style={{ color: d.color, marginBottom: 4, fontSize: 11, fontWeight: 700 }}>{d.name}</div>
                  <div style={{ color: '#5B6878' }}>Dist: {d.x.toFixed(2)} LD</div>
                  <div style={{ color: '#5B6878' }}>Vel: {d.y.toFixed(1)} km/s</div>
                  <div style={{ color: d.color, fontWeight: 600 }}>Score: {d.score}</div>
                </div>
              );
            }}
          />
          {/* Danger zone reference lines */}
          <ReferenceLine x={5}  stroke="#D89A1B" strokeDasharray="4 4" strokeOpacity={0.4}
            label={{ value: '5 LD', fill: '#D89A1B', fontSize: 9 }} />
          <ReferenceLine y={20} stroke="#E0682C" strokeDasharray="4 4" strokeOpacity={0.4}
            label={{ value: '20 km/s', fill: '#E0682C', fontSize: 9 }} />
          <Scatter data={data} shape="circle">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

// ── Chart 3: Threat Level Distribution ───────────────────
function ThreatDistributionChart({ asteroids }) {
  const data = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
    asteroids.forEach(a => {
      const lvl = a.threatLevel.label;
      if (counts[lvl] !== undefined) counts[lvl]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [asteroids]);

  const PIE_COLORS = {
    CRITICAL: '#D33A3A',
    HIGH:     '#E0682C',
    MODERATE: '#D89A1B',
    LOW:      '#2F9E5B',
  };

  return (
    <ChartPanel title="Threat Level Distribution">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#98A2B0'} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0];
              return (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E4DDCE',
                  borderRadius: 6, padding: '8px 12px',
                  fontFamily: 'IBM Plex Mono', fontSize: 11,
                  boxShadow: '0 4px 16px rgba(31,42,55,0.08)',
                }}>
                  <div style={{ color: PIE_COLORS[p.name], fontWeight: 700 }}>{p.name}</div>
                  <div style={{ color: '#1F2A37' }}>{p.value} objects</div>
                </div>
              );
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 10, color: PIE_COLORS[value] }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

// ── Exported wrapper ──────────────────────────────────────
export default function ThreatCharts({ asteroids, byDate }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <DailyCountChart      byDate={byDate} />
      <ThreatScatterChart   asteroids={asteroids} />
      <ThreatDistributionChart asteroids={asteroids} />
    </div>
  );
}