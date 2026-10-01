"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RAIL_Y, SLEEPER_STEP, makeBallast, makeFurniture, makeGlowLine, makeRails, platformLightAt } from "./geometry";
import { makeHaloTexture, makeNoiseTexture } from "./textures";

const X_AXIS = new THREE.Vector3(1, 0, 0);
const ONE = new THREE.Vector3(1, 1, 1);
const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

interface TrackProps {
  curve: THREE.Curve<THREE.Vector3>;
}

/** Dual rails on instanced sleepers over a gravel ballast ribbon, a faint copper centre line, and a shadow-catching ground. */
export function Track({ curve }: TrackProps) {
  const a = useMemo(
    () => ({
      rails: makeRails(curve),
      glow: makeGlowLine(curve),
      ballast: makeBallast(curve),
      sleeper: new THREE.BoxGeometry(0.06, 0.016, 0.27),
      noise: makeNoiseTexture(),
    }),
    [curve],
  );
  useEffect(
    () => () => {
      for (const asset of Object.values(a)) asset.dispose();
    },
    [a],
  );
  const count = useMemo(() => Math.floor(curve.getLength() / SLEEPER_STEP), [curve]);
  const sleepers = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = sleepers.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      curve.getPointAt(t, _p);
      curve.getTangentAt(t, _t);
      _p.y -= 0.023;
      mesh.setMatrixAt(i, _m.compose(_p, _q.setFromUnitVectors(X_AXIS, _t), ONE));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [curve, count]);

  return (
    <group>
      <mesh geometry={a.rails} receiveShadow>
        <meshStandardMaterial color="#cbb9a5" metalness={0.85} roughness={0.26} envMapIntensity={1.5} />
      </mesh>
      <instancedMesh ref={sleepers} args={[a.sleeper, undefined, count]} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial color="#5c4634" roughness={0.9} envMapIntensity={0.3} />
      </instancedMesh>
      <mesh geometry={a.ballast} receiveShadow>
        <meshStandardMaterial map={a.noise} color="#7a5638" roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      <mesh geometry={a.glow}>
        <meshBasicMaterial color="#d2913f" transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={RAIL_Y - 0.075} receiveShadow>
        <planeGeometry args={[70, 40]} />
        <shadowMaterial color="#0d0602" opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

interface FurnitureProps {
  curve: THREE.Curve<THREE.Vector3>;
  stationTs: number[];
  signalT: number;
  progress: RefObject<{ t: number }>;
}

/** Platforms (canopy, lamps, yellow board) and a signal, merged into two meshes plus one halo sprite per lamp. */
export function Furniture({ curve, stationTs, signalT, progress }: FurnitureProps) {
  const a = useMemo(() => ({ ...makeFurniture(curve, stationTs, signalT), halo: makeHaloTexture() }), [curve, stationTs, signalT]);
  useEffect(
    () => () => {
      a.structure.dispose();
      a.lamps.dispose();
      a.halo.dispose();
    },
    [a],
  );
  const lights = useMemo(() => stationTs.map((t) => platformLightAt(curve, t)), [curve, stationTs]);
  const halos = useRef<(THREE.Sprite | null)[]>([]);

  useFrame(() => {
    const t = progress.current.t;
    // two lamps per platform, in station order; the signal's halo comes last and stays steady
    for (let i = 0; i < stationTs.length * 2; i++) {
      const s = halos.current[i];
      if (!s) continue;
      const k = THREE.MathUtils.clamp(1 - Math.abs(t - stationTs[i >> 1]) / 0.04, 0, 1);
      s.scale.setScalar(a.halos[i].scale * (1 + k * 1.1));
      (s.material as THREE.SpriteMaterial).opacity = 0.32 + k * 0.5;
    }
  });

  return (
    <group>
      <mesh geometry={a.structure} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.85} metalness={0.1} envMapIntensity={0.4} />
      </mesh>
      <mesh geometry={a.lamps}>
        <meshBasicMaterial vertexColors />
      </mesh>
      {a.halos.map((h, i) => (
        <sprite
          key={i}
          ref={(el) => {
            halos.current[i] = el;
          }}
          position={h.position}
          scale={h.scale}
        >
          <spriteMaterial map={a.halo} color={h.color} transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
      {lights.map((p, i) => (
        <pointLight key={i} position={p} color="#ffc98a" intensity={0.55} distance={2} decay={2} />
      ))}
    </group>
  );
}
