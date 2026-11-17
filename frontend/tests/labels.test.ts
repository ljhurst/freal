import { describe, expect, it } from 'vitest';
import { estimateTextWidth, type LabelCandidate, placeLabels } from '@/lib/charts/labels';

const OPTIONS = {
  dotRadius: 7,
  fontSize: 12,
  gap: 4,
  bounds: { left: 20, top: 0, right: 400, bottom: 300 },
};

function candidate(id: string, x: number, y: number, text = id, iconWidth = 0): LabelCandidate {
  return { id, text, x, y, iconWidth };
}

describe('estimateTextWidth', () => {
  it('grows with the text and the font size', () => {
    expect(estimateTextWidth('Team 6', 12)).toBeCloseTo(6 * 12 * 0.58);
    expect(estimateTextWidth('Team 66', 12)).toBeGreaterThan(estimateTextWidth('Team 6', 12));
    expect(estimateTextWidth('Team 6', 16)).toBeGreaterThan(estimateTextWidth('Team 6', 12));
  });

  it('is the width a label reserves, so the first label to fill the space fits exactly', () => {
    const exact = 400 - 340 - 11;
    const text = 'x'.repeat(Math.floor(exact / (12 * 0.58)));

    expect(placeLabels([candidate('a', 340, 100, text)], OPTIONS).get('a')).toMatchObject({
      anchor: 'start',
    });
    expect(placeLabels([candidate('a', 340, 100, `${text}xx`)], OPTIONS).get('a')).toMatchObject({
      anchor: 'end',
    });
  });
});

describe('placeLabels with padding', () => {
  const NARROW = { ...OPTIONS, bounds: { left: 20, top: 0, right: 200, bottom: 300 } };
  const close = [candidate('a', 100, 100, 'abcdefgh'), candidate('b', 190, 100, 'b')];

  it('places two names that clear each other by a few pixels when there is no padding', () => {
    const placed = placeLabels(close, NARROW);

    expect([...placed.keys()]).toEqual(['a', 'b']);
  });

  it('drops the later name that would crowd the first, and keeps the first where it was', () => {
    const padded = placeLabels(close, { ...NARROW, padding: 8 });

    expect(padded.get('a')).toEqual(placeLabels(close, NARROW).get('a'));
    expect(padded.has('b')).toBe(false);
  });

  it('only keeps names apart from each other, so a name beside another dot is placed as before', () => {
    const near = [candidate('a', 100, 100), candidate('b', 100, 112)];

    expect(placeLabels(near, { ...OPTIONS, padding: 8 }).get('a')).toEqual(
      placeLabels(near, OPTIONS).get('a'),
    );
  });
});

describe('placeLabels', () => {
  it('leaves room for an icon beside the text', () => {
    const roomy = placeLabels([candidate('Team 6', 340, 100, 'Team 6', 0)], OPTIONS);
    const withIcon = placeLabels([candidate('Team 6', 340, 100, 'Team 6', 14)], OPTIONS);

    expect(roomy.get('Team 6')).toMatchObject({ anchor: 'start' });
    expect(withIcon.get('Team 6')).toMatchObject({ anchor: 'end' });
  });

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
