import { describe, expect, it } from 'vitest';
import { type LabelCandidate, placeLabels } from '@/lib/charts/labels';

const OPTIONS = {
  dotRadius: 7,
  fontSize: 12,
  gap: 4,
  bounds: { left: 20, top: 0, right: 400, bottom: 300 },
};

function candidate(id: string, x: number, y: number, text = id): LabelCandidate {
  return { id, text, x, y };
}

describe('placeLabels', () => {
  it('puts a label to the right of its dot when there is room', () => {
    const placed = placeLabels([candidate('a', 100, 100)], OPTIONS);

    expect(placed.get('a')).toEqual({ x: 111, y: 100, anchor: 'start' });
  });

  it('moves a label to the left when the right side runs off the chart', () => {
    const placed = placeLabels([candidate('Gridiron Gladiators', 380, 100)], OPTIONS);

    expect(placed.get('Gridiron Gladiators')).toMatchObject({ anchor: 'end', x: 369 });
  });

  it('leaves out a label that would sit on another dot when the other side is off the chart', () => {
    const placed = placeLabels([candidate('a', 10, 100), candidate('b', 25, 100)], OPTIONS);

    expect(placed.has('a')).toBe(false);
  });

  it('falls back to the left of the dot when the right side is blocked', () => {
    const placed = placeLabels([candidate('a', 100, 100), candidate('b', 115, 100)], OPTIONS);

    expect(placed.get('a')).toMatchObject({ anchor: 'end' });
  });

  it('gives the earlier candidate the space when two labels collide', () => {
    const placed = placeLabels(
      [candidate('first', 10, 100), candidate('second', 10, 104)],
      OPTIONS,
    );

    expect(placed.has('first')).toBe(true);
    expect(placed.has('second')).toBe(false);
  });

  it('is deterministic', () => {
    const candidates = [candidate('a', 50, 50), candidate('b', 60, 58), candidate('c', 200, 200)];

    expect([...placeLabels(candidates, OPTIONS)]).toEqual([...placeLabels(candidates, OPTIONS)]);
  });

  it('leaves out a label that fits on neither side', () => {
    const wide = candidate('x'.repeat(80), 200, 100);

    expect(placeLabels([wide], OPTIONS).size).toBe(0);
  });
});
