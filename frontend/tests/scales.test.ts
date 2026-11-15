import { describe, expect, it } from 'vitest';
import { integerTicks, linearScale, nearestPoint } from '@/lib/charts/scales';

describe('integerTicks', () => {
  it('has a tick at every whole number when there is room', () => {
    expect(integerTicks([0, 5], 16)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('thins the ticks to fit, keeping whole numbers', () => {
    const ticks = integerTicks([0, 14], 5);

    expect(ticks).toEqual([0, 3, 6, 9, 12]);
    expect(ticks.length).toBeLessThanOrEqual(5);
  });

  it('starts at the first whole number inside the domain', () => {
    expect(integerTicks([0.5, 3], 16)).toEqual([1, 2, 3]);
  });

  it('copes with a domain of a single point', () => {
    expect(integerTicks([2, 2], 16)).toEqual([2]);
  });
});

describe('linearScale', () => {
  it('maps the ends of the domain onto the ends of the range', () => {
    const scale = linearScale([1, 14], [48, 622]);

    expect(scale(1)).toBe(48);
    expect(scale(14)).toBe(622);
    expect(scale(7.5)).toBeCloseTo(335, 6);
  });

  it('can run backwards, as a y axis does', () => {
    const scale = linearScale([0, 10], [400, 0]);

    expect(scale(0)).toBe(400);
    expect(scale(10)).toBe(0);
    expect(scale(2.5)).toBe(300);
  });

  it('puts a single-point domain in the middle of the range', () => {
    expect(linearScale([3, 3], [0, 100])(3)).toBe(50);
  });
});

describe('nearestPoint', () => {
  const points = [
    { cx: 10, cy: 10 },
    { cx: 100, cy: 100 },
    { cx: 110, cy: 100 },
  ];

  it('finds the closest point within reach', () => {
    expect(nearestPoint(points, 12, 12, 40)).toBe(0);
    expect(nearestPoint(points, 108, 101, 40)).toBe(2);
  });

  it('finds nothing when every point is out of reach', () => {
    expect(nearestPoint(points, 300, 300, 40)).toBeNull();
  });

  it('finds nothing when there are no points', () => {
    expect(nearestPoint([], 0, 0, 40)).toBeNull();
  });
});
