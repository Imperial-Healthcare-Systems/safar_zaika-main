import * as THREE from "three";

/**
 * Canvas-painted textures for the hero train. Everything is procedural (no fetched assets).
 * The car livery is a small atlas: one region per part of the car shell (side, roof, front, back, bottom),
 * painted three times: colour map, emissive map (only the glowing parts) and roughness map (glass is glossy).
 */

export interface Dims {
  L: number;
  H: number;
  D: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Atlas {
  w: number;
  h: number;
  side: Rect;
  roof: Rect;
  front: Rect;
  back: Rect;
  bottom: Rect;
}

const PX = 560; // texture pixels per scene unit

export function atlasLayout({ L, H, D }: Dims): Atlas {
  const l = Math.round(L * PX);
  const h = Math.round(H * PX);
  const d = Math.round(D * PX);
  const y2 = h + d + 8;
  return {
    w: 1024,
    h: 320,
    side: { x: 0, y: 0, w: l, h },
    roof: { x: 0, y: h + 4, w: l, h: d },
    front: { x: 0, y: y2, w: d, h },
    back: { x: d + 4, y: y2, w: d, h },
    bottom: { x: 2 * d + 8, y: y2, w: d, h },
  };
}

const C = {
  cream: "#f3e5cb",
  creamLight: "#f8ecd6",
  creamDeep: "#e3d0ad",
  cocoa: "#3c1d0b",
  cocoaDeep: "#1f0e06",
  glass: "#1a0d07",
  copper: "#b86e24",
  gold: "#e3b461",
  skirt: "#3a2416",
  roof: "#d6c4a3",
  roofEdge: "#c3af8c",
};

/** Grey levels of the roughness map (three reads the green channel). */
const R = { paint: 118, glass: 28, skirt: 175, roof: 138, under: 190 };

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function colorTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Deterministic LCG so renders are pure and stable. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Neutral radial glow (alpha only); tinted per sprite. Bright core, long soft tail. */
export function makeHaloTexture() {
  const size = 128;
  const c = canvas(size, size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.08, "rgba(255,255,255,0.85)");
  g.addColorStop(0.22, "rgba(255,255,255,0.32)");
  g.addColorStop(0.5, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return colorTexture(c);
}

/** Soft black blob (alpha only) for the contact shadow under each car. */
export function makeContactShadowTexture() {
  const size = 128;
  const c = canvas(size, size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(0,0,0,0.9)");
  g.addColorStop(0.5, "rgba(0,0,0,0.4)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return colorTexture(c);
}

/** Vertical white-to-black ramp; alphaMap for the headlight beam cone (opaque at the apex). */
export function makeBeamTexture() {
  const c = canvas(4, 64);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "#fff");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 64);
  const t = new THREE.CanvasTexture(c);
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

/** Tileable warm gravel grain for the ballast. Multiplies the material colour. */
export function makeNoiseTexture() {
  const size = 128;
  const c = canvas(size, size);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const r = rng(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 140 + r() * 115;
    const warm = r() * 14;
    img.data[i] = v;
    img.data[i + 1] = v - warm * 0.6;
    img.data[i + 2] = v - warm;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(30,18,10,${0.2 + r() * 0.3})`;
    ctx.beginPath();
    ctx.arc(r() * size, r() * size, 1.5 + r() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = colorTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * Equirectangular "studio at dusk" for reflections: warm cocoa sky over a dark ground with a long
 * soft-box streak high up, so every rounded shoulder of the train carries a crisp highlight line.
 */
export function makeSkyTexture() {
  const w = 512;
  const h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a0c05");
  g.addColorStop(0.3, "#4a2611");
  g.addColorStop(0.46, "#a8652a");
  g.addColorStop(0.5, "#e4a65a");
  g.addColorStop(0.53, "#3b1f0e");
  g.addColorStop(0.7, "#160b05");
  g.addColorStop(1, "#070301");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const s = ctx.createLinearGradient(0, h * 0.21, 0, h * 0.31);
  s.addColorStop(0, "rgba(255,232,196,0)");
  s.addColorStop(0.5, "rgba(255,240,214,0.95)");
  s.addColorStop(1, "rgba(255,232,196,0)");
  ctx.fillStyle = s;
  ctx.fillRect(0, h * 0.21, w, h * 0.1);
  const sun = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.16);
  sun.addColorStop(0, "rgba(255,226,180,0.9)");
  sun.addColorStop(1, "rgba(255,200,140,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  const t = colorTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

/* ------------------------------------------------------------------------------------------------
 * Livery atlas
 * ---------------------------------------------------------------------------------------------- */

/** loco: lead driving car (white headlights); tail: rear driving car (red lamps); coach: intermediate car. */
type Kind = "loco" | "coach" | "tail";
type Layer = "color" | "glow" | "rough";

/** Painter bound to one atlas rect: u runs along the car, ay is height above the floor line (both 0..1). */
class Face {
  ctx: CanvasRenderingContext2D;
  r: Rect;
  layer: Layer;
  constructor(ctx: CanvasRenderingContext2D, r: Rect, layer: Layer) {
    this.ctx = ctx;
    this.r = r;
    this.layer = layer;
  }
  X(u: number) {
    return this.r.x + u * this.r.w;
  }
  Y(ay: number) {
    return this.r.y + (1 - ay) * this.r.h;
  }
  /** Fill the band between two heights over a u range. */
  band(ay0: number, ay1: number, style: string | CanvasGradient, u0 = 0, u1 = 1) {
    this.ctx.fillStyle = style;
    this.ctx.fillRect(this.X(u0), this.Y(ay1), (u1 - u0) * this.r.w, (ay1 - ay0) * this.r.h);
  }
  grey(v: number) {
    return `rgb(${v},${v},${v})`;
  }
}

/** A lit window pane; `dim` for the driver's cab. */
function pane(f: Face, u0: number, u1: number, ay0: number, ay1: number, dim = false) {
  const { ctx } = f;
  const x = f.X(u0);
  const y = f.Y(ay1);
  const w = (u1 - u0) * f.r.w;
  const h = (ay1 - ay0) * f.r.h;
  if (f.layer === "rough") return;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (f.layer === "glow") {
    g.addColorStop(0, dim ? "#8a6238" : "#ffd9a6");
    g.addColorStop(1, dim ? "#5a3c22" : "#e89a4c");
  } else {
    g.addColorStop(0, dim ? "#c9a06c" : "#fff3dc");
    g.addColorStop(0.45, dim ? "#b58650" : "#ffd59c");
    g.addColorStop(1, dim ? "#8e653a" : "#e6a254");
  }
  ctx.fillStyle = g;
  rrect(ctx, x, y, w, h, 2.5);
  ctx.fill();
  if (f.layer === "color") {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(x + 2, y + 1, w - 4, 2);
    ctx.fillStyle = "rgba(60,30,12,0.35)";
    ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  }
}

function door(f: Face, u0: number) {
  const u1 = u0 + 0.045;
  if (f.layer === "color") {
    f.band(0.13, 0.9, "#eadbbd", u0, u1);
    f.band(0.42, 0.76, C.glass, u0, u1);
    f.band(0.29, 0.35, C.copper, u0, u1);
    f.ctx.strokeStyle = "rgba(40,20,8,0.5)";
    f.ctx.lineWidth = 1;
    f.ctx.strokeRect(f.X(u0) + 0.5, f.Y(0.9) + 0.5, (u1 - u0) * f.r.w - 1, 0.77 * f.r.h - 1);
  }
  if (f.layer === "rough") f.band(0.42, 0.76, f.grey(R.glass), u0, u1);
  pane(f, u0 + 0.012, u1 - 0.012, 0.5, 0.7);
}

/** `noseAt`: fraction of the car length where the streamlined nose begins (driving cars only). */
function paintSide(f: Face, kind: Kind, noseAt: number) {
  const { ctx, r } = f;
  if (f.layer === "color") {
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, C.creamLight);
    g.addColorStop(0.5, C.cream);
    g.addColorStop(1, C.creamDeep);
    f.band(0, 1, g);
    f.band(0.94, 1, "rgba(0,0,0,0.08)");
    f.band(0.42, 0.76, C.glass); // continuous glass band
    f.band(0.405, 0.42, "rgba(255,255,255,0.3)"); // crease catching the light under the glass
    f.band(0.29, 0.35, C.copper);
    f.band(0.26, 0.27, C.gold);
    f.band(0, 0.13, C.skirt);
    f.band(0.13, 0.14, C.cocoaDeep);
  } else if (f.layer === "rough") {
    f.band(0, 1, f.grey(R.paint));
    f.band(0.42, 0.76, f.grey(R.glass));
    f.band(0, 0.14, f.grey(R.skirt));
  }
  if (kind === "coach") {
    for (let i = 0; i < 7; i++) {
      const u = 0.1 + 0.02 + i * 0.1143;
      pane(f, u, u + 0.075, 0.46, 0.72);
    }
    door(f, 0.015);
    door(f, 0.94);
    return;
  }
  // Driving car: passenger panes, cab door, cab window, then the wraparound windscreen band that sweeps up into the nose.
  for (let i = 0; i < 4; i++) {
    const u = 0.1 + i * 0.095;
    pane(f, u, u + 0.07, 0.46, 0.72);
  }
  door(f, 0.015);
  door(f, 0.5);
  pane(f, 0.585, 0.655, 0.46, 0.72, true);
  const u0 = noseAt;
  const u1 = noseAt + 0.7 * (1 - noseAt);
  if (f.layer !== "glow") {
    // the glass band sweeps up from the cab window into a slim wraparound that meets the windscreen on the roof
    ctx.fillStyle = f.layer === "color" ? C.glass : f.grey(R.glass);
    ctx.beginPath();
    ctx.moveTo(f.X(u0), f.Y(0.76));
    ctx.quadraticCurveTo(f.X(u0 + 0.08), f.Y(0.98), f.X(u0 + 0.16), f.Y(1));
    ctx.lineTo(f.X(u1), f.Y(1));
    ctx.lineTo(f.X(u1), f.Y(0.86));
    ctx.quadraticCurveTo(f.X(u0 + 0.12), f.Y(0.8), f.X(u0 + 0.06), f.Y(0.42));
    ctx.lineTo(f.X(u0), f.Y(0.42));
    ctx.closePath();
    ctx.fill();
  }
  if (f.layer === "color") {
    // nose bumper and the brand stripe sweeping down to the chin
    f.band(0, 0.2, C.skirt, u1 - 0.02, 1);
    ctx.fillStyle = C.copper;
    ctx.beginPath();
    ctx.moveTo(f.X(u1 - 0.1), f.Y(0.35));
    ctx.quadraticCurveTo(f.X(0.985), f.Y(0.35), f.X(1), f.Y(0.24));
    ctx.lineTo(f.X(1), f.Y(0.18));
    ctx.quadraticCurveTo(f.X(0.985), f.Y(0.29), f.X(u1 - 0.1), f.Y(0.29));
    ctx.closePath();
    ctx.fill();
  }
  // LED lamp strip low on each cheek of the nose: white headlights up front, red markers at the tail
  if (f.layer !== "rough") {
    const red = kind === "tail";
    ctx.fillStyle = f.layer === "glow" ? (red ? "#ff2a18" : "#fff6e6") : red ? "#8a1c12" : "#fffaf0";
    rrect(ctx, f.X(0.915), f.Y(0.36), 0.05 * r.w, 0.2 * r.h, 3);
    ctx.fill();
    if (f.layer === "color") {
      ctx.strokeStyle = "rgba(30,15,5,0.6)";
      ctx.lineWidth = 1;
      rrect(ctx, f.X(0.915) - 0.5, f.Y(0.36) - 0.5, 0.05 * r.w + 1, 0.2 * r.h + 1, 3.5);
      ctx.stroke();
    }
  }
}

function paintRoof(f: Face, kind: Kind, noseAt: number) {
  const { ctx, r } = f;
  if (f.layer === "color") {
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, C.roofEdge);
    g.addColorStop(0.5, C.roof);
    g.addColorStop(1, C.roofEdge);
    f.band(0, 1, g);
    f.band(0.33, 0.34, "rgba(0,0,0,0.08)");
    f.band(0.66, 0.67, "rgba(0,0,0,0.08)");
  } else if (f.layer === "rough") {
    f.band(0, 1, f.grey(R.roof));
  }
  if (kind === "coach" || f.layer === "glow") return;
  // windscreen on the sloping part of the nose, with curved top and bottom edges
  const u0 = noseAt + 0.2 * (1 - noseAt);
  const u1 = noseAt + 0.68 * (1 - noseAt);
  ctx.fillStyle = f.layer === "color" ? C.glass : f.grey(R.glass);
  ctx.beginPath();
  ctx.moveTo(f.X(u0), f.Y(0));
  ctx.quadraticCurveTo(f.X(u0 - 0.05), f.Y(0.5), f.X(u0), f.Y(1));
  ctx.lineTo(f.X(u1), f.Y(1));
  ctx.quadraticCurveTo(f.X(u1 + 0.025), f.Y(0.5), f.X(u1), f.Y(0));
  ctx.closePath();
  ctx.fill();
  if (f.layer === "color") {
    // a soft sky reflection across the glass
    const g = ctx.createLinearGradient(f.X(u0), 0, f.X(u1), 0);
    g.addColorStop(0, "rgba(255,220,180,0)");
    g.addColorStop(0.5, "rgba(255,220,180,0.14)");
    g.addColorStop(1, "rgba(255,220,180,0)");
    ctx.fillStyle = g;
    ctx.fill();
  }
}

/** Car ends: the gangway face for coaches and the loco rear, a plain patch for the loco tip. */
function paintEnd(f: Face, tip: boolean) {
  if (f.layer === "glow") return;
  if (f.layer === "rough") {
    f.band(0, 1, f.grey(R.paint));
    if (!tip) f.band(0.42, 0.76, f.grey(R.glass));
    return;
  }
  f.band(0, 1, C.cream);
  if (tip) {
    f.band(0, 0.3, C.skirt);
    f.band(0.3, 0.33, C.copper);
    return;
  }
  f.band(0.42, 0.76, C.glass);
  f.band(0.29, 0.35, C.copper);
  f.band(0, 0.13, C.skirt);
  f.ctx.fillStyle = "#2c1f16";
  rrect(f.ctx, f.X(0.3), f.Y(0.92), 0.4 * f.r.w, 0.8 * f.r.h, 4);
  f.ctx.fill();
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = rng(99);
  for (let i = 0; i < 9000; i++) {
    const light = r() > 0.5;
    ctx.fillStyle = light ? `rgba(255,255,255,${0.03 + r() * 0.05})` : `rgba(40,20,8,${0.03 + r() * 0.05})`;
    ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1);
  }
}

function paintAtlas(kind: Kind, atlas: Atlas, layer: Layer, noseAt: number) {
  const c = canvas(atlas.w, atlas.h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = layer === "color" ? C.cream : layer === "glow" ? "#000" : `rgb(${R.paint},${R.paint},${R.paint})`;
  ctx.fillRect(0, 0, atlas.w, atlas.h);
  paintSide(new Face(ctx, atlas.side, layer), kind, noseAt);
  paintRoof(new Face(ctx, atlas.roof, layer), kind, noseAt);
  paintEnd(new Face(ctx, atlas.front, layer), kind !== "coach");
  paintEnd(new Face(ctx, atlas.back, layer), false);
  const bottom = new Face(ctx, atlas.bottom, layer);
  if (layer === "color") {
    bottom.band(0, 1, "#1e130c");
    grain(ctx, atlas.w, atlas.h);
  } else if (layer === "rough") bottom.band(0, 1, bottom.grey(R.under));
  return c;
}

/** Colour, emissive and roughness atlases for one car kind; `noseAt` is where the nose begins along a driving car (see geometry.ts). */
export function makeLivery(kind: Kind, dims: Dims, noseAt = 1) {
  const atlas = atlasLayout(dims);
  const roughnessMap = new THREE.CanvasTexture(paintAtlas(kind, atlas, "rough", noseAt));
  roughnessMap.anisotropy = 4;
  return { map: colorTexture(paintAtlas(kind, atlas, "color", noseAt)), emissiveMap: colorTexture(paintAtlas(kind, atlas, "glow", noseAt)), roughnessMap };
}
