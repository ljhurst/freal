import { describe, expect, it } from 'vitest';
import { formatPercent, formatPoints, formatRecord, formatSigned } from '@/lib/format';

describe('format', () => {
  it('shows ties in a record only when there are some', () => {
    expect(formatRecord(6, 8, 0)).toBe('6-8');
    expect(formatRecord(6, 7, 1)).toBe('6-7-1');
  });

  it('formats points with a thousands separator and one decimal', () => {
    expect(formatPoints(1665.5)).toBe('1,665.5');
    expect(formatPoints(98)).toBe('98.0');
  });

  it('signs luck with a real minus sign and no negative zero', () => {
    expect(formatSigned(1.26)).toBe('+1.3');
    expect(formatSigned(-1.26)).toBe('−1.3');
    expect(formatSigned(-0.04)).toBe('0.0');
    expect(formatSigned(0)).toBe('0.0');
  });

  it('formats a fraction as a percentage', () => {
    expect(formatPercent(0.9123)).toBe('91.2%');
  });
});
