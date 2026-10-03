"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GROUND_Y, makeBackdrop } from "./geometry";
import { makeBokehTexture, makeHorizonTexture } from "./textures";

/**
 * Everything behind the route, back to front: a dusk glow on the horizon, far hills, a town with lit
 * windows, a parked silhouette train on a second track, then line-side trees and poles. Each layer sits
 * at its own depth so the camera's pointer parallax and push-in slide them against each other; the
 * scene fog grades them into the navy haze.
 */
export function Backdrop() {
  const a = useMemo(() => ({ ...makeBackdrop(), bokeh: makeBokehTexture(), horizon: makeHorizonTexture() }), []);
  useEffect(
    () => () => {
      for (const asset of Object.values(a)) if (asset instanceof THREE.BufferGeometry || asset instanceof THREE.Texture) asset.dispose();
    },
    [a],
  );
  return (
    <group>
      <mesh position={[0, GROUND_Y + 2.1, -34]}>
        <planeGeometry args={[220, 4.6]} />
        <meshBasicMaterial map={a.horizon} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      <mesh geometry={a.hills}>
        <meshBasicMaterial color="#10264d" />
      </mesh>
      <mesh geometry={a.town}>
        <meshBasicMaterial color="#0a1a3c" />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[a.windows.position, 3]} />
          <bufferAttribute attach="attributes-color" args={[a.windows.color, 3]} />
        </bufferGeometry>
        <pointsMaterial map={a.bokeh} size={0.18} sizeAttenuation vertexColors transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </points>
      <mesh geometry={a.farRails}>
        <meshStandardMaterial color="#8294b0" metalness={0.8} roughness={0.35} envMapIntensity={1.2} />
      </mesh>
      <mesh geometry={a.farBallast}>
        <meshStandardMaterial color="#1d2b45" roughness={0.95} envMapIntensity={0.2} />
      </mesh>
      <mesh geometry={a.farTrain}>
        <meshStandardMaterial color="#132648" roughness={0.55} metalness={0.25} envMapIntensity={0.9} />
      </mesh>
      <mesh geometry={a.trees}>
        <meshBasicMaterial color="#050e22" />
      </mesh>
    </group>
  );
}

interface MotesProps {
  animate: boolean;
  count: number;
  size: number;
  opacity: number;
  color: string;
  /** Full extent of the cloud on each axis. */
  spread: [number, number, number];
  /** Centre of the cloud. */
  offset: [number, number, number];
  seed: number;
  /** Soft bokeh discs instead of hard points. */
  soft?: boolean;
  drift?: number;
}

/** Deterministic cloud of additive points that slowly turns about the origin: fine dust near the track, or sparse bokeh at every depth. */
export function Motes({ animate, count, size, opacity, color, spread, offset, seed, soft, drift = 0.012 }: MotesProps) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) for (let k = 0; k < 3; k++) arr[i * 3 + k] = offset[k] + (rand() - 0.5) * spread[k];
    return arr;
  }, [count, seed, spread, offset]);
  const map = useMemo(() => (soft ? makeBokehTexture() : null), [soft]);
  useEffect(() => () => map?.dispose(), [map]);

  useFrame((state) => {
    if (!animate || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * drift;
    ref.current.position.y = Math.sin(t * 0.25) * 0.12;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={map} color={color} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
