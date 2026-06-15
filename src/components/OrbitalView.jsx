// ============================================================
// src/components/OrbitalView.jsx
// ============================================================
// 3D interactive solar system visualization using Three.js
// via the @react-three/fiber and @react-three/drei wrappers.
//
// CONCEPTS:
//  - @react-three/fiber (R3F): React renderer for Three.js.
//    Instead of calling new THREE.Mesh(), you write <mesh>.
//  - @react-three/drei: helper components (OrbitControls, Stars, etc.)
//  - useFrame: R3F hook that runs on every animation frame (60fps)
//    — used here to rotate planets and orbit asteroids.
//  - Instanced meshes (via <points>): render thousands of stars efficiently
//  - Scale mapping: real orbital distances are compressed for visibility
// ============================================================

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// ── Constants ─────────────────────────────────────────────
// Compressed orbital distances for visualization (not to scale)
const EARTH_ORBIT_RADIUS = 4;
const AU_TO_VIS = 4; // 1 AU = 4 visualization units

// ── Sun ───────────────────────────────────────────────────
function Sun() {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle pulsing scale to simulate solar activity
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 0.8) * 0.02;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color="#FFA020"
          emissive="#FF6000"
          emissiveIntensity={2}
          roughness={0.8}
        />
      </mesh>
      {/* Corona glow — additive-blended larger sphere */}
      <mesh>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshBasicMaterial
          color="#FF8000"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Point light: illuminates all planets */}
      <pointLight color="#FFA020" intensity={2} distance={40} />
    </group>
  );
}

// ── Orbit Ring ─────────────────────────────────────────────
// Draws a dashed circle ring to represent a planet's orbit path
function OrbitRing({ radius, opacity = 0.25 }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial color="#5B6878" opacity={opacity} transparent />
    </lineLoop>
  );
}

// ── Planet ─────────────────────────────────────────────────
function Planet({ radius, orbitRadius, color, speed, name, tilt = 0 }) {
  const ref = useRef();
  const initialAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const angle = initialAngle + clock.getElapsedTime() * speed;
    ref.current.position.set(
      Math.cos(angle) * orbitRadius,
      0,
      Math.sin(angle) * orbitRadius
    );
    ref.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

// ── Earth with atmosphere ─────────────────────────────────
function Earth() {
  const ref = useRef();
  const atmoRef = useRef();
  const initialAngle = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const angle = initialAngle.current + clock.getElapsedTime() * 0.35;
    const x = Math.cos(angle) * EARTH_ORBIT_RADIUS;
    const z = Math.sin(angle) * EARTH_ORBIT_RADIUS;
    ref.current.position.set(x, 0, z);
    if (atmoRef.current) atmoRef.current.position.set(x, 0, z);
    ref.current.rotation.y += 0.008;
  });

  return (
    <>
      {/* Earth core */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#1a6b9a" roughness={0.6} />
      </mesh>
      {/* Atmosphere */}
      <mesh ref={atmoRef}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}

// ── Asteroid Object ───────────────────────────────────────
// Each asteroid orbits on an inclined elliptical path.
// The inclination and eccentricity are derived from the asteroid's
// real orbital parameters (or approximated from miss distance).
function AsteroidObject({ asteroid, isSelected, onClick }) {
  const ref = useRef();
  const trailRef = useRef([]);

  // Derive orbital visualization params from miss distance
  // Closer asteroids get more eccentric, dramatic orbits
  const orbitA = useMemo(() => {
    const lunarDist = asteroid.missDistance.lunar;
    // Semi-major axis: scale to visible range
    return Math.max(3.5, Math.min(EARTH_ORBIT_RADIUS + lunarDist * 0.02, 7));
  }, [asteroid.missDistance.lunar]);

  const orbitB = useMemo(() => orbitA * (0.8 + Math.random() * 0.15), [orbitA]);
  const inclination = useMemo(() => (Math.random() - 0.5) * 0.8, []); // radians
  const speed = useMemo(() => 0.08 + Math.random() * 0.12, []);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const color = asteroid.threatLevel.color;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + phase;
    // Elliptical orbit with inclination
    const x = Math.cos(t) * orbitA;
    const z = Math.sin(t) * orbitB;
    // Apply rotation matrix for inclination (tilt)
    ref.current.position.set(
      x,
      Math.sin(t) * orbitB * Math.sin(inclination),
      z * Math.cos(inclination)
    );
  });

  return (
    <mesh ref={ref} onClick={() => onClick(asteroid)}>
      {/* Use an irregular shape — IcosahedronGeometry for rocky look */}
      <icosahedronGeometry args={[isSelected ? 0.08 : 0.05, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isSelected ? 1.5 : 0.5}
        roughness={0.9}
      />
    </mesh>
  );
}

// ── Scene ─────────────────────────────────────────────────
function Scene({ asteroids, selectedId, onSelect }) {
  // Show top 40 by threat score to keep 3D performance smooth
  const visibleAsteroids = useMemo(
    () => asteroids.slice(0, 40),
    [asteroids]
  );

  return (
    <>
      {/* Soft fill light so objects read clearly on the light canvas background */}
      <ambientLight intensity={0.6} />
      <hemisphereLight skyColor="#FAF7F1" groundColor="#E4DDCE" intensity={0.4} />

      <Sun />

      {/* Inner planets — simplified for context */}
      <OrbitRing radius={1.6} opacity={0.18} />
      <Planet radius={0.06} orbitRadius={1.6} color="#cc8844" speed={0.9}  name="Mercury" />

      <OrbitRing radius={2.8} opacity={0.18} />
      <Planet radius={0.10} orbitRadius={2.8} color="#e8b870" speed={0.55} name="Venus" />

      {/* Earth orbit */}
      <OrbitRing radius={EARTH_ORBIT_RADIUS} opacity={0.35} />
      <Earth />

      <OrbitRing radius={5.5} opacity={0.15} />
      <Planet radius={0.12} orbitRadius={5.5} color="#cc5533" speed={0.18} name="Mars" />

      {/* Asteroid objects */}
      {visibleAsteroids.map(ast => (
        <AsteroidObject
          key={ast.id}
          asteroid={ast}
          isSelected={ast.id === selectedId}
          onClick={onSelect}
        />
      ))}

      {/* Camera controls: orbit (drag), zoom (scroll), pan (right-drag) */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </>
  );
}

// ── Legend ────────────────────────────────────────────────
function OrbitalLegend() {
  const items = [
    { color: '#D33A3A', label: 'Critical threat' },
    { color: '#E0682C', label: 'High threat' },
    { color: '#D89A1B', label: 'Moderate threat' },
    { color: '#2F9E5B', label: 'Low threat' },
    { color: '#1a6b9a', label: 'Earth' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16,
      background: 'rgba(255,255,255,0.9)',
      border: '1px solid #E4DDCE',
      borderRadius: 8,
      padding: '10px 14px',
      pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(31,42,55,0.06)',
    }}>
      {items.map(item => (
        <div key={item.label} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 4,
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          color: '#5B6878',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: item.color,
          }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────
export default function OrbitalView({ asteroids, selectedId, onSelect }) {
  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        flex: 1,
        minHeight: 420,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Panel label */}
      <div style={{
        position: 'absolute', top: 14, left: 16, zIndex: 10,
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
        color: '#1D7A78', pointerEvents: 'none',
        textTransform: 'uppercase',
      }}>
        Inner Solar System · 3D Orbital View
      </div>

      <div style={{
        position: 'absolute', top: 14, right: 16, zIndex: 10,
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10, color: '#98A2B0', pointerEvents: 'none',
      }}>
        Drag to rotate · Scroll to zoom
      </div>

      {/* Three.js canvas — fills the panel */}
      <Canvas
        camera={{ position: [0, 6, 12], fov: 55 }}
        style={{ width: '100%', height: '100%', minHeight: 420, background: '#FAF7F1' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene
          asteroids={asteroids}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </Canvas>

      <OrbitalLegend />
    </motion.div>
  );
}