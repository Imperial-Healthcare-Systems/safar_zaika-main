"use client";
/* eslint-disable react-hooks/immutability -- useFrame is an imperative per-frame callback that mutates three.js objects by design */

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { AXLE, BOGIE_X, CAR, CAR_OFFSETS, FLOOR, GAUGE, LOCO, NOSE_AT, TAIL, WHEEL_R, WHEEL_Y, makeCoachFittings, makeLocoFittings, makeShell, makeVents, makeWheel } from "./geometry";
import { makeBeamTexture, makeContactShadowTexture, makeHaloTexture, makeLivery } from "./textures";

export type Progress = RefObject<{ t: number }>;
/**
 * Loop control in curve parameter space. The train runs toward t = 0 (right to left on screen, nose
 * toward the camera at the near point); it wraps to `start` and fast-forwards while fully off-screen
 * (t > enter: not yet entered on the right; t < exit: gone past the left edge).
 */
export interface TrainBounds {
  start: number;
  enter: number;
  exit: number;
}

const SPEED = 1; // scene units per second (~85 km/h at 1 unit ~ 24 m)
const BEAM_LENGTH = 3;
const SWAY = 0.0055; // peak body roll in radians (~0.3 degrees)
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const ONE = new THREE.Vector3(1, 1, 1);
const KEY_OFFSET = new THREE.Vector3(-2, 4.5, 4.5);
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _wheel = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _roll = new THREE.Quaternion();
const _m = new THREE.Matrix4();

/** [x, z] of the 8 wheels of a car: two bogies, two axles each, both rails. */
const WHEEL_SLOTS: [number, number][] = [];
for (const b of [-1, 1]) for (const a of [-1, 1]) for (const s of [-1, 1]) WHEEL_SLOTS.push([b * BOGIE_X + (a * AXLE) / 2, (s * GAUGE) / 2]);

// Lamps: the LED strips painted low on each cheek of the nose (see paintSide in textures.ts).
const HEADLIGHT_X = LOCO.L / 2 - 0.065;
const HEADLIGHT_Y = FLOOR + 0.028;
const HEADLIGHT_Z = 0.056;

function buildAssets() {
  const loco = makeLivery("loco", LOCO, NOSE_AT);
  const tail = makeLivery("tail", LOCO, NOSE_AT);
  const coach = makeLivery("coach", CAR);
  return {
    locoShell: makeShell(LOCO, true),
    coachShell: makeShell(CAR),
    locoMap: loco.map,
    locoGlow: loco.emissiveMap,
    locoRough: loco.roughnessMap,
    tailMap: tail.map,
    tailGlow: tail.emissiveMap,
    tailRough: tail.roughnessMap,
    coachMap: coach.map,
    coachGlow: coach.emissiveMap,
    coachRough: coach.roughnessMap,
    locoFittings: makeLocoFittings(),
    coachFittings: makeCoachFittings(),
    vents: makeVents(),
    wheel: makeWheel(),
    contact: new THREE.PlaneGeometry(1, 1),
    beam: new THREE.ConeGeometry(0.55, BEAM_LENGTH, 14, 1, true),
    halo: makeHaloTexture(),
    shadow: makeContactShadowTexture(),
    beamRamp: makeBeamTexture(),
  };
}
type Assets = ReturnType<typeof buildAssets>;

type Slot = (el: THREE.Group | null) => void;
type WheelSlot = (el: THREE.InstancedMesh | null) => void;

/** Cream body with a clearcoat; the roughness map keeps the glass bands glossy and the paint satin. */
function Body({ geometry, map, glow, rough, y }: { geometry: THREE.BufferGeometry; map: THREE.Texture; glow: THREE.Texture; rough: THREE.Texture; y: number }) {
  return (
    <mesh geometry={geometry} position-y={y} castShadow>
      <meshPhysicalMaterial map={map} emissiveMap={glow} emissive="#ffffff" emissiveIntensity={1} roughnessMap={rough} roughness={1} metalness={0.08} clearcoat={0.4} clearcoatRoughness={0.3} envMapIntensity={1.25} />
    </mesh>
  );
}

function Wheels({ a, wheelRef }: { a: Assets; wheelRef: WheelSlot }) {
  return (
    <instancedMesh ref={wheelRef} args={[a.wheel, undefined, WHEEL_SLOTS.length]} castShadow frustumCulled={false}>
      <meshStandardMaterial color="#8a7c70" metalness={0.6} roughness={0.45} envMapIntensity={0.7} />
    </instancedMesh>
  );
}

function Fittings({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color="#3d332c" metalness={0.5} roughness={0.6} envMapIntensity={0.5} />
    </mesh>
  );
}

function ContactShadow({ a, L, D }: { a: Assets; L: number; D: number }) {
  return (
    <mesh geometry={a.contact} rotation-x={-Math.PI / 2} position-y={-0.013} scale={[L + 0.3, D + 0.4, 1]}>
      <meshBasicMaterial map={a.shadow} transparent depthWrite={false} opacity={0.8} />
    </mesh>
  );
}

/** A lamp: a tight bright core plus a wide soft bloom, both additive sprites. */
function Lamp({ a, position, color, core, bloom, opacity = 0.45 }: { a: Assets; position: [number, number, number]; color: string; core: number; bloom: number; opacity?: number }) {
  return (
    <>
      <sprite position={position} scale={core}>
        <spriteMaterial map={a.halo} color="#ffffff" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={position} scale={bloom}>
        <spriteMaterial map={a.halo} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  );
}

/** Streamlined driving car. The rear one is the same shell turned round, with red marker lamps instead of headlights. */
function DrivingCar({ a, carRef, wheelRef, tail }: { a: Assets; carRef: Slot; wheelRef: WheelSlot; tail?: boolean }) {
  const spot = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useLayoutEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current;
  }, []);
  return (
    <group ref={carRef}>
      <Wheels a={a} wheelRef={wheelRef} />
      <ContactShadow a={a} L={LOCO.L} D={LOCO.D} />
      <group rotation-y={tail ? Math.PI : 0}>
        <Body geometry={a.locoShell} map={tail ? a.tailMap : a.locoMap} glow={tail ? a.tailGlow : a.locoGlow} rough={tail ? a.tailRough : a.locoRough} y={0} />
        <Fittings geometry={a.locoFittings} />
        {[-HEADLIGHT_Z, HEADLIGHT_Z].map((z) =>
          tail ? (
            <Lamp key={z} a={a} position={[HEADLIGHT_X, HEADLIGHT_Y, z]} color="#ff3a22" core={0.032} bloom={0.13} opacity={0.6} />
          ) : (
            <Lamp key={z} a={a} position={[HEADLIGHT_X, HEADLIGHT_Y, z]} color="#ffd9a8" core={0.04} bloom={0.2} opacity={0.4} />
          ),
        )}
        {!tail && (
          <>
            <mesh geometry={a.beam} position={[HEADLIGHT_X + BEAM_LENGTH / 2, HEADLIGHT_Y, 0]} rotation-z={Math.PI / 2}>
              <meshBasicMaterial color="#ffd2a0" alphaMap={a.beamRamp} transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <spotLight ref={spot} position={[HEADLIGHT_X, HEADLIGHT_Y, 0]} angle={0.42} penumbra={0.8} distance={9} decay={1.3} intensity={18} color="#ffd9a6" />
            <object3D ref={target} position={[6, -0.3, 0]} />
          </>
        )}
      </group>
    </group>
  );
}

function Coach({ a, carRef, wheelRef }: { a: Assets; carRef: Slot; wheelRef: WheelSlot }) {
  return (
    <group ref={carRef}>
      <Body geometry={a.coachShell} map={a.coachMap} glow={a.coachGlow} rough={a.coachRough} y={0} />
      <Fittings geometry={a.coachFittings} />
      <mesh geometry={a.vents} castShadow>
        <meshStandardMaterial color="#cdbb9b" roughness={0.6} metalness={0.1} envMapIntensity={0.8} />
      </mesh>
      <Wheels a={a} wheelRef={wheelRef} />
      <ContactShadow a={a} L={CAR.L} D={CAR.D} />
    </group>
  );
}

interface TrainProps {
  curve: THREE.Curve<THREE.Vector3>;
  progress: Progress;
  animate: boolean;
  keyLight: RefObject<THREE.DirectionalLight | null>;
  bounds: TrainBounds;
}

export function Train({ curve, progress, animate, keyLight, bounds }: TrainProps) {
  const a = useMemo(() => buildAssets(), []);
  useEffect(
    () => () => {
      for (const asset of Object.values(a)) asset.dispose();
    },
    [a],
  );
  const cars = useRef<(THREE.Group | null)[]>([]);
  const wheels = useRef<(THREE.InstancedMesh | null)[]>([]);
  const spin = useRef(0);
  const length = useMemo(() => curve.getLength(), [curve]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const time = state.clock.elapsedTime;
    const p = progress.current;
    if (animate) {
      const hidden = p.t > bounds.enter || p.t < bounds.exit;
      p.t -= (delta * SPEED * (hidden ? 6 : 1)) / length;
      if (p.t < 0) p.t = bounds.start;
      spin.current -= (delta * SPEED) / WHEEL_R;
    }
    _q.setFromAxisAngle(Z_AXIS, spin.current);
    for (let i = 0; i < CAR_OFFSETS.length; i++) {
      const t = Math.min(1, p.t + CAR_OFFSETS[i] / length);
      const car = cars.current[i];
      if (car) {
        curve.getPointAt(t, _pos);
        curve.getTangentAt(t, _tan).negate(); // cars face the direction of travel (decreasing t)
        car.position.copy(_pos);
        car.quaternion.setFromUnitVectors(X_AXIS, _tan);
        if (animate) {
          // each car rocks on its suspension a little out of phase with its neighbours
          car.position.y += Math.sin(time * 2.6 + i * 1.1) * 0.0012;
          car.quaternion.multiply(_roll.setFromAxisAngle(X_AXIS, Math.sin(time * 1.7 + i * 1.9) * SWAY));
        }
      }
      const w = wheels.current[i];
      if (w) {
        for (let j = 0; j < WHEEL_SLOTS.length; j++) {
          w.setMatrixAt(j, _m.compose(_wheel.set(WHEEL_SLOTS[j][0], WHEEL_Y, WHEEL_SLOTS[j][1]), _q, ONE));
        }
        w.instanceMatrix.needsUpdate = true;
      }
    }
    // The shadow-casting key light tracks the middle of the train so its 1024px map stays sharp.
    const light = keyLight.current;
    if (light) {
      curve.getPointAt(Math.min(1, p.t + TAIL / 2 / length), _pos);
      light.position.copy(_pos).add(KEY_OFFSET);
      light.target.position.copy(_pos);
      light.target.updateMatrixWorld();
    }
  }, -1);

  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const carRef = (el: THREE.Group | null) => {
          cars.current[i] = el;
        };
        const wheelRef = (el: THREE.InstancedMesh | null) => {
          wheels.current[i] = el;
        };
        return i === 0 || i === 3 ? <DrivingCar key={i} a={a} tail={i === 3} carRef={carRef} wheelRef={wheelRef} /> : <Coach key={i} a={a} carRef={carRef} wheelRef={wheelRef} />;
      })}
    </group>
  );
}
