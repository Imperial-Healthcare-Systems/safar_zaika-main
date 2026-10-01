"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { LOCO, TAIL, findT, makeRoute } from "./scene/geometry";
import { makeSkyTexture } from "./scene/textures";
import { Furniture, Track } from "./scene/Track";
import { Train } from "./scene/Train";

/**
 * Cinematic hero route: a dual-rail track on ballast, five lit platforms with canopies, a signal, and a
 * streamlined four-car express in Safar Zaika livery, all procedural (no models, no HDRIs).
 * Loaded only on the home hero, only on md+ screens, only when WebGL exists.
 */

const CAMERA = new THREE.Vector3(0.5, 0.05, 7.4);
const PUSH = new THREE.Vector3(0.35, 0.3, 1.5); // first-load dolly starts this far out and eases in
const PUSH_SECONDS = 2.5;
const TARGET = new THREE.Vector3(0.5, -0.7, -3);
const STATION_X = [-7, -3.6, -0.2, 3.4, 7];
const SIGNAL_X = 4.3;
const _goal = new THREE.Vector3();

/** Low three-quarter view just above rail height: a 2.5 s push-in on load, then a gentle pointer dolly. */
function CameraRig({ animate }: { animate: boolean }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  // Narrow canvases (4:3 and below) look up a touch so the track band stays below the headline and the PNR card.
  const targetY = size.width / size.height < 1.2 ? TARGET.y + 0.3 : TARGET.y;
  useLayoutEffect(() => {
    camera.position.copy(CAMERA);
    if (animate) camera.position.add(PUSH);
    camera.lookAt(TARGET.x, targetY, TARGET.z);
  }, [camera, targetY, animate]);
  useFrame((state) => {
    if (!animate) return;
    const k = Math.min(1, state.clock.elapsedTime / PUSH_SECONDS);
    const out = (1 - k) ** 3; // cubic ease-out: 1 at load, 0 once settled
    _goal.set(CAMERA.x + state.pointer.x * 0.35 + PUSH.x * out, CAMERA.y + state.pointer.y * 0.12 + PUSH.y * out, CAMERA.z + PUSH.z * out);
    state.camera.position.lerp(_goal, k < 1 ? 0.25 : 0.035);
    state.camera.lookAt(TARGET.x, targetY, TARGET.z);
  });
  return null;
}

/** Gradient equirect -> PMREM. The PMREM blur shader trips a harmless HLSL constant-folding warning (X4122) on ANGLE/D3D, so three's shader-log check is skipped for that one compile. */
function makeEnvironment(gl: THREE.WebGLRenderer) {
  const sky = makeSkyTexture();
  const pmrem = new THREE.PMREMGenerator(gl);
  const check = gl.debug.checkShaderErrors;
  gl.debug.checkShaderErrors = false;
  const target = pmrem.fromEquirectangular(sky);
  gl.debug.checkShaderErrors = check;
  pmrem.dispose();
  sky.dispose();
  return target;
}

/** Procedural dusk environment so the cream bodywork and rails pick up reflections. */
function Environment() {
  const gl = useThree((s) => s.gl);
  const env = useMemo(() => makeEnvironment(gl), [gl]);
  useEffect(() => () => env.dispose(), [env]);
  return <primitive object={env.texture} attach="environment" />;
}

function Particles({ animate, count = 160 }: { animate: boolean; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    // deterministic pseudo-random so renders are pure and stable
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 20;
      arr[i * 3 + 1] = rand() * 4 - 1.6;
      arr[i * 3 + 2] = (rand() - 0.5) * 10 - 2;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!animate || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.012;
    ref.current.position.y = Math.sin(t * 0.25) * 0.12;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e3b461" size={0.03} sizeAttenuation transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function HeroScene({ animate = true }: { animate?: boolean }) {
  const curve = useMemo(() => makeRoute(), []);
  const bounds = useMemo(() => {
    const length = curve.getLength();
    return {
      start: 1 - TAIL / length - 0.002, // tail at the far (right) end of the curve
      enter: findT(curve, 11.5) + LOCO.L / 2 / length, // nose still off-screen right (even at 21:9)
      exit: findT(curve, -9) - TAIL / length, // tail gone past the left edge
      view: findT(curve, 1.4), // static / first frame: loco at the near point, lower right, nose toward the camera
    };
  }, [curve]);
  const stationTs = useMemo(() => STATION_X.map((x) => findT(curve, x)), [curve]);
  const signalT = useMemo(() => findT(curve, SIGNAL_X), [curve]);
  const progress = useRef({ t: bounds.view });
  const keyLight = useRef<THREE.DirectionalLight>(null);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 38, near: 0.1, far: 45, position: [CAMERA.x, CAMERA.y, CAMERA.z] }}
      frameloop={animate ? "always" : "demand"}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <fog attach="fog" args={["#1d0e05", 7, 19]} />
      <Environment />
      <hemisphereLight args={["#ffd3a3", "#3a1d0c", 0.45]} />
      <directionalLight ref={keyLight} castShadow color="#ffe0bb" intensity={2.8} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0003} shadow-normalBias={0.015}>
        <orthographicCamera attach="shadow-camera" args={[-3.4, 3.4, 2.4, -2.4, 0.5, 18]} />
      </directionalLight>
      <directionalLight position={[-3, 2.5, -7]} color="#b86e24" intensity={2.2} />
      <CameraRig animate={animate} />
      <Track curve={curve} />
      <Furniture curve={curve} stationTs={stationTs} signalT={signalT} progress={progress} />
      <Train curve={curve} progress={progress} animate={animate} keyLight={keyLight} bounds={bounds} />
      <Particles animate={animate} />
    </Canvas>
  );
}
