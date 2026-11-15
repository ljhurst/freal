import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { SeasonCache } from '@/lib/season/cache';
import { fakeApi, seasonReport } from './helpers';

function setup() {
  const season = vi.fn(async () => seasonReport());
  let now = 1_000_000;
  const cache = new SeasonCache(fakeApi({ season }), () => now);
  return { cache, season, advance: (ms: number) => (now += ms) };
}

describe('SeasonCache', () => {
  it('fetches a season once however often it is asked for', async () => {
    const { cache, season } = setup();

    const first = cache.get(7, 2025);
    const second = cache.get(7, 2025);

    expect(second).toBe(first);
    await first;
    expect(season).toHaveBeenCalledOnce();
  });

  it('keeps leagues and years apart', async () => {
    const { cache, season } = setup();

    await Promise.all([cache.get(7, 2025), cache.get(7, 2024), cache.get(8, 2025)]);

    expect(season).toHaveBeenCalledTimes(3);
  });

  it('fetches again once a season is five minutes old', async () => {
    const { cache, season, advance } = setup();
    await cache.get(7, 2025);

    advance(4 * 60_000);
    await cache.get(7, 2025);
    expect(season).toHaveBeenCalledOnce();

    advance(2 * 60_000);
    await cache.get(7, 2025);
    expect(season).toHaveBeenCalledTimes(2);
  });

  it('does not keep a failure, so a retry can succeed', async () => {
    const season = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(502, 'espn_unavailable'))
      .mockResolvedValueOnce(seasonReport());
    const cache = new SeasonCache(fakeApi({ season }));

    await expect(cache.get(7, 2025)).rejects.toMatchObject({ code: 'espn_unavailable' });
    await expect(cache.get(7, 2025)).resolves.toMatchObject({ year: 2025 });

    expect(season).toHaveBeenCalledTimes(2);
  });
});
