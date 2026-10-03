"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { LOCO, TAIL, findT, makeRoute } from "./scene/geometry";
import { makeSkyTexture } from "./scene/textures";
import { Backdrop, Motes } from "./scene/Backdrop";
import { Furniture, Track } from "./scene/Track";
import { Train } from "./scene/Train";

/**
 * Cinematic hero route: a dual-rail track on wet ground, five lit platforms with canopies, a signal, and a
 * streamlined four-car express in Safar Zaika livery, in front of a town, hills and a blue dusk glow that
 * fade into the haze. All procedural (no models, no HDRIs). Loaded only on the home hero, only on md+ screens,
 * only when WebGL exists.
 */

const CAMERA = new THREE.Vector3(0.6, 0.5, 6.5); // close to the near point of the route, high enough that the train runs under the hero copy
const PUSH = new THREE.Vector3(0.35, 0.3, 1.5); // first-load dolly starts this far out and eases in
const PUSH_SECONDS = 2.5;
const SCROLL = new THREE.Vector3(0, -0.45, 1.8); // scroll-out dolly: the camera settles back and down as the hero leaves
const TARGET = new THREE.Vector3(0.5, -0.07, -3); // raised with the camera: same pitch, so the horizon stays behind the search card
const STATION_X = [-7, -3.6, -0.2, 3.4, 7];
const SIGNAL_X = 4.3;
const _goal = new THREE.Vector3();

/** Three-quarter view from just above the platforms: a 2.5 s push-in on load, a gentle pointer dolly, and a scrubbed dolly-out as the hero scrolls away. */
function CameraRig({ animate }: { animate: boolean }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scroll = useRef({ k: 0 });
  const pointer = useRef(new THREE.Vector2());
  useLayoutEffect(() => {
    camera.position.copy(CAMERA);
    if (animate) camera.position.add(PUSH);
    camera.lookAt(TARGET);
  }, [camera, animate]);
  useEffect(() => {
    if (!animate) return;
    // The hero copy sits over the canvas, so pointer parallax listens on the window rather than the canvas.
    const onMove = (e: PointerEvent) => pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2);
    window.addEventListener("pointermove", onMove, { passive: true });
    // The canvas wrapper spans the hero stage; progress runs 0 -> 1 as the stage scrolls out of view.
    const tween = gsap.to(scroll.current, {
      k: 1,
      ease: "none",
      scrollTrigger: { trigger: gl.domElement.parentElement ?? gl.domElement, start: "top top", end: "bottom top", scrub: 0.6 },
    });
    return () => {
      window.removeEventListener("pointermove", onMove);
      (tween.scrollTrigger as ScrollTrigger | undefined)?.kill();
      tween.kill();
    };
  }, [animate, gl]);
  useFrame((state) => {
    if (!animate) return;
    const k = Math.min(1, state.clock.elapsedTime / PUSH_SECONDS);
    const out = (1 - k) ** 3; // cubic ease-out: 1 at load, 0 once settled
    const s = scroll.current.k;
    _goal.set(
      CAMERA.x + pointer.current.x * 0.35 + PUSH.x * out + SCROLL.x * s,
      CAMERA.y + pointer.current.y * 0.12 + PUSH.y * out + SCROLL.y * s,
      CAMERA.z + PUSH.z * out + SCROLL.z * s,
    );
    state.camera.position.lerp(_goal, k < 1 ? 0.25 : 0.035);
    state.camera.lookAt(TARGET.x, TARGET.y - s * 0.2, TARGET.z);
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

/** Procedural dusk environment so the light bodywork, rails and wet ground pick up reflections. */
function Environment() {
  const gl = useThree((s) => s.gl);
  const env = useMemo(() => makeEnvironment(gl), [gl]);
  useEffect(() => () => env.dispose(), [env]);
  return <primitive object={env.texture} attach="environment" />;
}

const DUST_SPREAD: [number, number, number] = [20, 4, 10];
const DUST_OFFSET: [number, number, number] = [0, 0.4, -2];
const BOKEH_SPREAD: [number, number, number] = [26, 3.6, 22];
const BOKEH_OFFSET: [number, number, number] = [0, 0.1, -9];

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
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 38, near: 0.1, far: 60, position: [CAMERA.x, CAMERA.y, CAMERA.z] }}
      frameloop={animate ? "always" : "demand"}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      {/* Navy haze: clear on the train, half on the far end of the route, full on the hills so each layer back reads a shade lighter. */}
      <fog attach="fog" args={["#0b1e3f", 4, 40]} />
      <Environment />
      <hemisphereLight args={["#bcd6ff", "#0b1e3f", 0.45]} />
      <directionalLight ref={keyLight} castShadow color="#dbe8ff" intensity={2.8} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0003} shadow-normalBias={0.015}>
        <orthographicCamera attach="shadow-camera" args={[-4.5, 4.5, 3, -3, 0.5, 20]} />
      </directionalLight>
      <directionalLight position={[-3, 2.5, -7]} color="#2d5fae" intensity={2.2} />
      <CameraRig animate={animate} />
      <Backdrop />
      <Track curve={curve} />
      <Furniture curve={curve} stationTs={stationTs} signalT={signalT} progress={progress} />
      <Train curve={curve} progress={progress} animate={animate} keyLight={keyLight} bounds={bounds} />
      <Motes animate={animate} count={160} size={0.03} opacity={0.4} color="#a8c8f5" spread={DUST_SPREAD} offset={DUST_OFFSET} seed={1337} />
      <Motes animate={animate} count={44} size={0.75} opacity={0.12} color="#ffb457" spread={BOKEH_SPREAD} offset={BOKEH_OFFSET} seed={77} soft drift={0.005} />
    </Canvas>
  );
}
