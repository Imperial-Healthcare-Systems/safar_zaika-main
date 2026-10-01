import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { atlasLayout, rng, type Dims, type Rect } from "./textures";

/** Scene units: one coach is ~24 m, so 1 unit ~ 24 m. All y values are relative to the rail top. */
export const RAIL_Y = -1.3;
export const GROUND_Y = RAIL_Y - 0.05; // wet ground plane just under the ballast
export const GAUGE = 0.17;
export const SLEEPER_STEP = 0.22;

export const CAR: Dims = { L: 1, H: 0.17, D: 0.18 };
export const LOCO: Dims = { L: 1.2, H: 0.17, D: 0.18 };
export const FLOOR = 0.07; // body underside above the rail top
export const WHEEL_R = 0.032;
export const WHEEL_Y = 0.037;
export const BOGIE_X = 0.33;
export const AXLE = 0.12;
export const GAP = 0.06;
export const NOSE = 0.38; // length of the streamlined nose at +x
export const NOSE_AT = 1 - NOSE / LOCO.L; // fraction of the loco length where the nose begins (the livery painter uses it too)
const RAKE = 0.08; // how far the roof is pulled back at the very tip (the chin bulges ahead of the windscreen)
const TIP = 0.08; // length of the rounded tip
const TIP_W = 0.4; // plan-view width at the tip, relative to the body
const TIP_H = 0.42; // height at the tip, relative to the body

/** Double-ended trainset: driving car, two coaches, driving car. Arc distance from the lead car centre back to each car centre. */
export const CAR_LENGTHS = [LOCO.L, CAR.L, CAR.L, LOCO.L];
export const CAR_OFFSETS = CAR_LENGTHS.map((_, i) => CAR_LENGTHS.slice(0, i).reduce((d, l, j) => d + l / 2 + GAP + CAR_LENGTHS[j + 1] / 2, 0));
export const TAIL = CAR_OFFSETS[3] + LOCO.L / 2; // lead car centre -> tail end

const UP = new THREE.Vector3(0, 1, 0);
const ONE = new THREE.Vector3(1, 1, 1);
const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _side = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _c = new THREE.Color();

/** Flat route that bulges toward the camera at centre-right; both ends run far off-screen so the loop wraps unseen. */
const ROUTE = [
  [-15, -8.6],
  [-8.5, -4.6],
  [-4.6, -1.9],
  [-1.6, 0.4],
  [1.8, 1.2],
  [5.2, -1.4],
  [8.5, -4.5],
  [15.5, -9],
].map(([x, z]) => new THREE.Vector3(x, RAIL_Y, z));

export function makeRoute() {
  const c = new THREE.CatmullRomCurve3(ROUTE, false, "centripetal", 0.5);
  c.arcLengthDivisions = 800;
  return c;
}

/** Arc-length parameter where the route crosses world x (x grows monotonically along the route). */
export function findT(curve: THREE.Curve<THREE.Vector3>, x: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (curve.getPointAt(mid, _p).x < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Horizontal unit vector perpendicular to the route (+ = camera side for a left-to-right tangent). */
export function sideAt(curve: THREE.Curve<THREE.Vector3>, t: number, out: THREE.Vector3) {
  curve.getTangentAt(t, _t);
  return out.crossVectors(_t, UP).normalize();
}

/** Local frame at a route parameter: origin on the rail top, +x along the route, +z toward the camera. */
export function frameAt(curve: THREE.Curve<THREE.Vector3>, t: number) {
  const position = curve.getPointAt(t);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), curve.getTangentAt(t));
  return { position, quaternion };
}

class OffsetCurve extends THREE.Curve<THREE.Vector3> {
  base: THREE.Curve<THREE.Vector3>;
  offset: number;
  lift: number;
  constructor(base: THREE.Curve<THREE.Vector3>, offset: number, lift: number) {
    super();
    this.base = base;
    this.offset = offset;
    this.lift = lift;
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    this.base.getPointAt(t, target);
    sideAt(this.base, t, _side);
    target.addScaledVector(_side, this.offset);
    target.y += this.lift;
    return target;
  }
}

function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return g;
}

export function makeRails(curve: THREE.Curve<THREE.Vector3>, segments = 480, radial = 5) {
  return merge([-GAUGE / 2, GAUGE / 2].map((o) => new THREE.TubeGeometry(new OffsetCurve(curve, o, 0), segments, 0.011, radial, false)));
}

export function makeGlowLine(curve: THREE.Curve<THREE.Vector3>) {
  return new THREE.TubeGeometry(new OffsetCurve(curve, 0, -0.008), 320, 0.006, 4, false);
}

/** Trapezoid ballast ribbon under the sleepers; u repeats along the route for the gravel texture. */
export function makeBallast(curve: THREE.Curve<THREE.Vector3>, samples = 260) {
  const rows: [number, number][] = [
    [-0.38, -0.045],
    [-0.23, -0.032],
    [0.23, -0.032],
    [0.38, -0.045],
  ];
  const positions = new Float32Array(samples * rows.length * 3);
  const uvs = new Float32Array(samples * rows.length * 2);
  const index: number[] = [];
  const length = curve.getLength();
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    curve.getPointAt(t, _p);
    sideAt(curve, t, _side);
    rows.forEach(([off, dy], j) => {
      const v = i * rows.length + j;
      positions[v * 3] = _p.x + _side.x * off;
      positions[v * 3 + 1] = _p.y + dy;
      positions[v * 3 + 2] = _p.z + _side.z * off;
      uvs[v * 2] = (t * length) / 0.6;
      uvs[v * 2 + 1] = j / (rows.length - 1);
    });
    if (i === 0) continue;
    for (let j = 0; j < rows.length - 1; j++) {
      const a = (i - 1) * rows.length + j;
      const c = i * rows.length + j;
      index.push(a, a + 1, c, a + 1, c + 1, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------------------------------------
 * Car shells: a rounded-rect cross-section swept along the car. The loco's section tapers, drops and
 * rakes back into a rounded nose. Normals are computed from the sweep itself so the shading stays
 * smooth across the UV seams, and every vertex reads its own atlas region (side / roof / bottom).
 * ---------------------------------------------------------------------------------------------- */

/** Cubic Bezier through (p0, p1, p2, p3) at k. */
function bez(k: number, p0: number, p1: number, p2: number, p3: number) {
  const j = 1 - k;
  return j * j * j * p0 + 3 * j * j * k * p1 + 3 * j * k * k * p2 + k * k * k * p3;
}

/**
 * Closed section outline (z across, y up, relative to the section centre), starting at the bottom
 * centre and running round via +z. `cuts` are the loop indices (at the 45 degree point of each corner)
 * where the atlas region changes: bottom | side | roof | side | bottom.
 */
function makeProfile({ H, D }: Dims) {
  const hw = D / 2;
  const hh = H / 2;
  const rt = 0.06; // generous roof shoulders
  const rb = 0.018;
  const pts: { z: number; y: number }[] = [{ z: 0, y: -hh }];
  const cuts: number[] = [];
  const corner = (cz: number, cy: number, r: number, a0: number, n: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((i / n) * Math.PI) / 2;
      if (i === n / 2) cuts.push(pts.length);
      pts.push({ z: cz + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
  };
  corner(hw - rb, -hh + rb, rb, -Math.PI / 2, 4);
  corner(hw - rt, hh - rt, rt, 0, 8);
  corner(-hw + rt, hh - rt, rt, Math.PI / 2, 8);
  corner(-hw + rb, -hh + rb, rb, Math.PI, 4);
  pts.push({ z: 0, y: -hh });
  return { pts, cuts };
}

/** Section placement at fraction s of the car length: x of the section plane, width/height scale, rake, lift of the floor line. */
function sectionAt(dims: Dims, s: number, nose: boolean) {
  const x = -dims.L / 2 + s * dims.L;
  if (!nose || s <= NOSE_AT) return { x, ws: 1, hs: 1, rake: 0, lift: 0 };
  const k = (s - NOSE_AT) / (1 - NOSE_AT);
  let ws = bez(k, 1, 1, 0.8, TIP_W);
  let hs = bez(k, 1, 1, 0.9, TIP_H);
  const rake = RAKE * k * k;
  const q = Math.max(0, (s - (1 - TIP / dims.L)) / (TIP / dims.L));
  const round = Math.sqrt(1 - q * q * 0.9); // bullet rounding of the last few centimetres
  const lift = ((1 - round) * hs * dims.H) / 2; // keep the rounding centred on the section
  ws *= round;
  hs *= round;
  return { x, ws, hs, rake, lift };
}

export function makeShell(dims: Dims, nose = false) {
  const { H, D } = dims;
  const atlas = atlasLayout(dims);
  const { pts, cuts } = makeProfile(dims);
  const n = pts.length;
  const ss = nose ? [0, NOSE_AT * 0.5, NOSE_AT] : [0, 0.5, 1];
  if (nose) for (let i = 1; i <= 40; i++) ss.push(NOSE_AT + (i / 40) * (1 - NOSE_AT));
  const m = ss.length;

  // 1. positions of every (station, loop point)
  const P = new Float32Array(m * n * 3);
  for (let i = 0; i < m; i++) {
    const { x, ws, hs, rake, lift } = sectionAt(dims, ss[i], nose);
    for (let j = 0; j < n; j++) {
      const ay = (pts[j].y + H / 2) / H; // 0 at the floor line, 1 at the roof line
      const o = (i * n + j) * 3;
      P[o] = x - rake * ay * ay;
      P[o + 1] = FLOOR + lift + ay * H * hs;
      P[o + 2] = pts[j].z * ws;
    }
  }
  // 2. normals from the sweep (finite differences along and around; the loop wraps past the seam)
  const N = new Float32Array(m * n * 3);
  const ts = new THREE.Vector3();
  const tq = new THREE.Vector3();
  const at = (i: number, j: number, out: THREE.Vector3) => out.fromArray(P, (i * n + j) * 3);
  for (let i = 0; i < m; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(m - 1, i + 1);
    for (let j = 0; j < n; j++) {
      const j0 = j === 0 ? n - 2 : j - 1;
      const j1 = j === n - 1 ? 1 : j + 1;
      at(i1, j, ts).sub(at(i0, j, _p));
      at(i, j1, tq).sub(at(i, j0, _p));
      _p.crossVectors(ts, tq).normalize().toArray(N, (i * n + j) * 3);
    }
  }
  // 3. vertices: each atlas region gets its own copy of the boundary loop points
  const regions: [number, number, Rect, boolean][] = [
    [0, cuts[0], atlas.bottom, false],
    [cuts[0], cuts[1], atlas.side, true],
    [cuts[1], cuts[2], atlas.roof, false],
    [cuts[2], cuts[3], atlas.side, true],
    [cuts[3], n - 1, atlas.bottom, false],
  ];
  const position: number[] = [];
  const normal: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const put = (r: Rect, a: number, b: number) => uv.push((r.x + a * r.w) / atlas.w, 1 - (r.y + (1 - b) * r.h) / atlas.h);
  for (const [j0, j1, rect, vertical] of regions) {
    const base = position.length / 3;
    const span = j1 - j0 + 1;
    for (let i = 0; i < m; i++) {
      for (let j = j0; j <= j1; j++) {
        const o = (i * n + j) * 3;
        position.push(P[o], P[o + 1], P[o + 2]);
        normal.push(N[o], N[o + 1], N[o + 2]);
        put(rect, ss[i], vertical ? (pts[j].y + H / 2) / H : pts[j].z / D + 0.5);
      }
    }
    for (let i = 0; i < m - 1; i++) {
      for (let j = 0; j < span - 1; j++) {
        const a = base + i * span + j;
        const c = a + span;
        index.push(a, c, a + 1, a + 1, c, c + 1);
      }
    }
  }
  // 4. end caps (flat fans): the rear reads the gangway end, the loco tip its own small patch
  const cap = (i: number, rect: Rect, dir: 1 | -1) => {
    const base = position.length / 3;
    const { x, hs, rake, lift } = sectionAt(dims, ss[i], nose);
    position.push(x - rake * 0.25, FLOOR + lift + (H * hs) / 2, 0);
    normal.push(dir, 0, 0);
    put(rect, 0.5, 0.5);
    for (let j = 0; j < n - 1; j++) {
      const o = (i * n + j) * 3;
      position.push(P[o], P[o + 1], P[o + 2]);
      normal.push(dir, 0, 0);
      put(rect, pts[j].z / D + 0.5, (pts[j].y + H / 2) / H);
    }
    for (let j = 0; j < n - 1; j++) {
      const a = base + 1 + j;
      const b = base + 1 + ((j + 1) % (n - 1));
      if (dir < 0) index.push(base, a, b);
      else index.push(base, b, a);
    }
  };
  cap(0, atlas.back, -1);
  cap(m - 1, nose ? atlas.front : atlas.back, 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function rod(a: [number, number, number], b: [number, number, number], r: number) {
  const from = new THREE.Vector3(...a);
  const to = new THREE.Vector3(...b);
  const g = new THREE.CylinderGeometry(r, r, from.distanceTo(to), 6);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, to.clone().sub(from).normalize()));
  g.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
  return g;
}

/** Horizontal cylinder along x (an under-frame tank). */
function tank(r: number, len: number, x: number, y: number, z: number) {
  const g = new THREE.CylinderGeometry(r, r, len, 10);
  g.rotateZ(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

function underframe(L: number) {
  return [
    box(0.26, 0.03, 0.15, -BOGIE_X, 0.052, 0),
    box(0.26, 0.03, 0.15, BOGIE_X, 0.052, 0),
    box(L - 0.25, 0.022, 0.1, 0, 0.06, 0),
    tank(0.019, 0.2, 0.02, 0.046, 0.03),
    box(0.1, 0.03, 0.05, -0.12, 0.05, -0.04),
  ];
}

/** Dark metal parts of a coach: bogies, sill, tank, battery box and the gangway connector at the +x end. */
export function makeCoachFittings() {
  return merge([...underframe(CAR.L), box(0.07, 0.11, 0.11, CAR.L / 2 + 0.03, FLOOR + 0.055, 0)]);
}

/** Dark metal parts of the loco: bogies, roof equipment and a single-arm pantograph. */
export function makeLocoFittings() {
  const roof = FLOOR + LOCO.H;
  return merge([
    ...underframe(LOCO.L),
    box(0.26, 0.03, 0.12, -0.25, roof + 0.012, 0),
    box(0.1, 0.02, 0.1, 0.02, roof + 0.008, 0),
    box(0.18, 0.01, 0.1, -0.2, roof + 0.025, 0),
    rod([-0.26, roof + 0.03, 0], [-0.14, roof + 0.11, 0], 0.005),
    rod([-0.14, roof + 0.11, 0], [-0.24, roof + 0.165, 0], 0.004),
    box(0.028, 0.006, 0.17, -0.24, roof + 0.168, 0),
  ]);
}

/** Two rounded roof-mounted AC pods per coach. */
export function makeVents() {
  const y = FLOOR + CAR.H + 0.008;
  const pod = (x: number) => {
    const g = new RoundedBoxGeometry(0.17, 0.028, 0.11, 2, 0.012);
    g.translate(x, y, 0);
    return g;
  };
  return merge([pod(-0.27), pod(0.27)]);
}

export function makeWheel() {
  const g = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.024, 14);
  g.rotateX(Math.PI / 2);
  return g;
}

/* ------------------------------------------------------------------------------------------------
 * Line-side furniture, merged into two draw calls: lit structure (vertex colours) and unlit lamps.
 * ---------------------------------------------------------------------------------------------- */

interface Frame {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

function tint(g: THREE.BufferGeometry, hex: string) {
  _c.set(hex);
  const count = g.attributes.position.count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) arr.set([_c.r, _c.g, _c.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}

function place(parts: THREE.BufferGeometry[], frame: Frame) {
  _m.compose(frame.position, frame.quaternion, ONE);
  for (const p of parts) p.applyMatrix4(_m);
  return parts;
}

function post(x: number, z: number, y0: number, y1: number, r: number) {
  const g = new THREE.CylinderGeometry(r, r * 1.2, y1 - y0, 6);
  g.translate(x, (y0 + y1) / 2, z);
  return g;
}

export interface Halo {
  position: THREE.Vector3;
  color: string;
  scale: number;
}

const DARK = "#2b211b";
const LAMP_X = [-0.32, 0.32];

/** Platform on the far side of the track: slab with a yellow safety line, a canopy, two lamp posts and a generic yellow board. */
function platform(frame: Frame, structure: THREE.BufferGeometry[], lamps: THREE.BufferGeometry[], pools: THREE.BufferGeometry[], halos: Halo[]) {
  const parts = [
    tint(box(1.24, 0.05, 0.2, 0, 0.01, -0.31), "#6d4c31"),
    tint(box(1.24, 0.05, 0.012, 0, 0.01, -0.216), "#4a3222"),
    tint(box(1.24, 0.004, 0.012, 0, 0.037, -0.228), "#c9a53d"),
    tint(post(-0.42, -0.37, 0.035, 0.34, 0.007), DARK),
    tint(post(0.42, -0.37, 0.035, 0.34, 0.007), DARK),
    tint(box(1.12, 0.012, 0.21, 0, 0.345, -0.33), "#3b2a1f"),
    tint(box(1.12, 0.028, 0.008, 0, 0.337, -0.228), "#8a5a2a"),
    tint(post(0.02, -0.352, 0.035, 0.225, 0.004), DARK),
    tint(post(0.18, -0.352, 0.035, 0.225, 0.004), DARK),
    tint(box(0.13, 0.012, 0.002, 0.1, 0.262, -0.3415), "#2a1a10"),
    tint(box(0.09, 0.008, 0.002, 0.1, 0.243, -0.3415), "#2a1a10"),
  ];
  for (const x of LAMP_X) {
    parts.push(tint(post(x, -0.37, 0.035, 0.43, 0.006), DARK), tint(box(0.03, 0.012, 0.03, x, 0.436, -0.37), DARK));
    const bulb = new THREE.SphereGeometry(0.014, 8, 6);
    bulb.translate(x, 0.425, -0.37);
    lamps.push(...place([tint(bulb, "#ffe6c0")], frame));
    halos.push({ position: new THREE.Vector3(x, 0.425, -0.37).applyQuaternion(frame.quaternion).add(frame.position), color: "#e3b461", scale: 0.42 });
    // pool of lamplight on the slab (a halo-textured decal just above the yellow line)
    const pool = new THREE.PlaneGeometry(0.5, 0.34);
    pool.rotateX(-Math.PI / 2);
    pool.translate(x, 0.0395, -0.33);
    pools.push(...place([pool], frame));
  }
  structure.push(...place(parts, frame));
  lamps.push(...place([tint(box(0.22, 0.06, 0.008, 0.1, 0.25, -0.346), "#f0c04a")], frame));
}

/** Colour-light signal on the camera side of the line; its green aspect faces the camera so the lamp reads. */
function signal(frame: Frame, structure: THREE.BufferGeometry[], lamps: THREE.BufferGeometry[], halos: Halo[]) {
  const z = 0.3;
  structure.push(...place([tint(post(0, z, 0, 0.5, 0.008), DARK), tint(box(0.03, 0.1, 0.045, 0, 0.47, z), "#1a120c"), tint(box(0.05, 0.012, 0.06, -0.005, 0.525, z), "#1a120c")], frame));
  const lamp = new THREE.SphereGeometry(0.013, 8, 6);
  lamp.translate(-0.016, 0.455, z + 0.012);
  lamps.push(...place([tint(lamp, "#3ee884")], frame));
  halos.push({ position: new THREE.Vector3(-0.02, 0.455, z + 0.016).applyQuaternion(frame.quaternion).add(frame.position), color: "#39ff8a", scale: 0.26 });
}

/** Everything beside the track: five platforms and one signal, merged into two geometries. */
export function makeFurniture(curve: THREE.Curve<THREE.Vector3>, stationTs: number[], signalT: number) {
  const structure: THREE.BufferGeometry[] = [];
  const lamps: THREE.BufferGeometry[] = [];
  const pools: THREE.BufferGeometry[] = [];
  const halos: Halo[] = [];
  for (const t of stationTs) platform(frameAt(curve, t), structure, lamps, pools, halos);
  signal(frameAt(curve, signalT), structure, lamps, halos);
  return { structure: merge(structure), lamps: merge(lamps), pools: merge(pools), halos };
}

/** Point-light position per platform (centred under the canopy). */
export function platformLightAt(curve: THREE.Curve<THREE.Vector3>, t: number) {
  const f = frameAt(curve, t);
  return new THREE.Vector3(0, 0.3, -0.3).applyQuaternion(f.quaternion).add(f.position);
}

/* ------------------------------------------------------------------------------------------------
 * Backdrop: far hills, a town skyline with lit windows, line-side trees and poles, and a second
 * track with a static silhouette train. Everything sits behind the route at staggered depths so the
 * pointer parallax and the camera push-in slide the layers against each other.
 * ---------------------------------------------------------------------------------------------- */

const SKY_W = 44; // half-width of the backdrop layers

/** Vertical silhouette strip facing the camera: a height profile sampled every `step` along x, from below the ground up. */
function ridge(z: number, step: number, height: (x: number) => number) {
  const n = Math.round((2 * SKY_W) / step) + 1;
  const pos = new Float32Array(n * 6);
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = -SKY_W + i * step;
    pos.set([x, GROUND_Y - 0.5, z, x, GROUND_Y + height(x), z], i * 6);
    if (i) idx.push(i * 2 - 2, i * 2, i * 2 + 1, i * 2 - 2, i * 2 + 1, i * 2 - 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/** Rolling hills on the horizon. */
function makeHills(z: number) {
  return ridge(z, 0.5, (x) => 1.3 + 0.9 * Math.sin(x * 0.11 + 1.2) + 0.5 * Math.sin(x * 0.27 + 2.1) + 0.25 * Math.sin(x * 0.63 + 0.4));
}

/** Blocky town skyline: a run of flat-roofed buildings, each a quad, with lit windows scattered on their faces. */
function makeTown(z: number, seed: number, windows: number[], windowColors: number[]) {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const warm = ["#ffd9a6", "#ffc07a", "#ffe6c0", "#e8a860"].map((h) => new THREE.Color(h));
  let x = -SKY_W + r() * 2;
  while (x < SKY_W) {
    const w = 0.5 + r() * 1.9;
    const tall = r() < 0.12;
    const h = tall ? 1.1 + r() * 0.8 : 0.22 + r() * r() * 0.9;
    const g = new THREE.PlaneGeometry(w, h + 0.4);
    g.translate(x + w / 2, GROUND_Y + h / 2 - 0.2, z);
    parts.push(g);
    const n = Math.floor(w * h * 7 * (0.3 + r()));
    for (let i = 0; i < n; i++) {
      windows.push(x + 0.08 + r() * (w - 0.16), GROUND_Y + 0.06 + r() * (h - 0.1), z + 0.02);
      const c = warm[Math.floor(r() * warm.length)];
      const dim = 0.35 + r() * 0.65;
      windowColors.push(c.r * dim, c.g * dim, c.b * dim);
    }
    x += w + r() * 0.9;
  }
  return merge(parts);
}

/** Dark line-side shapes between the far track and the town: conifer cones and telegraph poles with a crossbar. */
function makeTrees(seed: number) {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 70; i++) {
    const h = 0.35 + r() * 0.6;
    const g = new THREE.ConeGeometry(h * 0.32, h, 5);
    g.translate(-SKY_W * 0.85 + r() * SKY_W * 1.7, GROUND_Y + h / 2 - 0.02, -13.5 - r() * 4.5);
    parts.push(g);
  }
  for (let x = -SKY_W * 0.8; x < SKY_W * 0.8; x += 2.3) {
    parts.push(box(0.024, 0.62, 0.024, x, GROUND_Y + 0.3, -12.3), box(0.16, 0.014, 0.024, x, GROUND_Y + 0.56, -12.3));
  }
  return merge(parts);
}

/** Gently curved second track well behind the platforms. */
export function makeFarRoute() {
  const pts = [
    [-40, -14.2],
    [-16, -11.6],
    [10, -11.4],
    [40, -14.8],
  ].map(([x, z]) => new THREE.Vector3(x, RAIL_Y, z));
  const c = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
  c.arcLengthDivisions = 200;
  return c;
}

/** Static silhouette trainset parked on the far track with its lead car at `x`, plus its lit window positions. */
function makeFarTrain(curve: THREE.Curve<THREE.Vector3>, x: number, windows: number[], windowColors: number[]) {
  const length = curve.getLength();
  const t0 = findT(curve, x);
  const parts: THREE.BufferGeometry[] = [];
  const c = new THREE.Color("#ffc98a");
  const w = new THREE.Vector3();
  for (let i = 0; i < CAR_OFFSETS.length; i++) {
    const f = frameAt(curve, Math.min(1, t0 + CAR_OFFSETS[i] / length));
    const loco = i === 0 || i === 3;
    const g = loco ? makeShell(LOCO, true) : makeShell(CAR);
    if (i === 3) g.rotateY(Math.PI);
    parts.push(...place([g], f));
    const panes = loco ? [0, 1, 2, 3].map((j) => 0.135 + j * 0.095) : [0, 1, 2, 3, 4, 5, 6].map((j) => 0.1575 + j * 0.1143);
    for (const u of panes) {
      w.set((u - 0.5) * (loco ? LOCO.L : CAR.L), FLOOR + 0.1, CAR.D / 2 + 0.01).applyQuaternion(f.quaternion).add(f.position);
      windows.push(w.x, w.y, w.z);
      windowColors.push(c.r * 0.8, c.g * 0.8, c.b * 0.8);
    }
  }
  return merge(parts);
}

export function makeBackdrop() {
  const windows: number[] = [];
  const windowColors: number[] = [];
  const far = makeFarRoute();
  const town = merge([makeTown(-21, 11, windows, windowColors), makeTown(-25, 12, windows, windowColors)]);
  const farTrain = makeFarTrain(far, -3.2, windows, windowColors);
  return {
    hills: makeHills(-31),
    town,
    trees: makeTrees(13),
    farRails: makeRails(far, 120, 4),
    farBallast: makeBallast(far, 70),
    farTrain,
    windows: { position: new Float32Array(windows), color: new Float32Array(windowColors) },
  };
}
