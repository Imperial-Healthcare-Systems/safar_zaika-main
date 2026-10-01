export interface Point {
  x: number;
  y: number;
}

/** Catmull-Rom → cubic Bézier so routes read as drawn lines, not polylines. */
export function smoothPath(points: Point[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export interface LatLngBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Equirectangular projection of lat/lng into a box, preserving aspect.
 * Pass `bounds` to project against a fixed box (so several maps share one
 * projection); otherwise the box is the extent of the points themselves.
 * Good enough for a schematic route map; swap for a real map SDK later.
 */
export function projectLatLng(stations: { lat: number; lng: number }[], width: number, height: number, margin = 60, bounds?: LatLngBounds): Point[] {
  if (stations.length === 0) return [];
  const lats = stations.map((s) => s.lat);
  const lngs = stations.map((s) => s.lng);
  const minLat = bounds?.minLat ?? Math.min(...lats);
  const maxLat = bounds?.maxLat ?? Math.max(...lats);
  const minLng = bounds?.minLng ?? Math.min(...lngs);
  const maxLng = bounds?.maxLng ?? Math.max(...lngs);
  const meanLat = (minLat + maxLat) / 2;
  const kx = Math.cos((meanLat * Math.PI) / 180);
  const spanX = Math.max(0.5, (maxLng - minLng) * kx);
  const spanY = Math.max(0.5, maxLat - minLat);
  const scale = Math.min((width - margin * 2) / spanX, (height - margin * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  return stations.map((s) => ({
    x: offsetX + (s.lng - minLng) * kx * scale,
    y: offsetY + (maxLat - s.lat) * scale,
  }));
}
