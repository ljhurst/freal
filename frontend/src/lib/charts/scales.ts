/** Whole-number ticks across a domain, thinned so there are never more than `maxCount`. */
export function integerTicks(domain: readonly [number, number], maxCount: number): number[] {
  const [low, high] = domain;
  const span = Math.max(1, Math.ceil(high) - Math.floor(low));
  const step = Math.max(1, Math.ceil(span / Math.max(1, maxCount)));
  const ticks: number[] = [];
  for (let tick = Math.ceil(low); tick <= high; tick += step) {
    ticks.push(tick);
  }
  return ticks;
}

/** Maps a value in the domain linearly onto the range; a single-point domain lands mid-range. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [start, end] = domain;
  const span = end - start;
  return (value) =>
    span === 0
      ? (range[0] + range[1]) / 2
      : range[0] + ((value - start) / span) * (range[1] - range[0]);
}

/** Index of the point closest to (x, y) and no farther than `reach` away, if any. */
export function nearestPoint(
  points: readonly { cx: number; cy: number }[],
  x: number,
  y: number,
  reach: number,
): number | null {
  let nearest: number | null = null;
  let best = reach;
  points.forEach((point, index) => {
    const distance = Math.hypot(point.cx - x, point.cy - y);
    if (distance <= best) {
      best = distance;
      nearest = index;
    }
  });
  return nearest;
}
