import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { LeaguesCache } from '@/lib/leagues/cache';
import { fakeApi, league } from './helpers';

describe('LeaguesCache', () => {
  it('has nothing to show until the list has loaded, then keeps showing it', async () => {
    const cache = new LeaguesCache(fakeApi({ leagues: async () => [league()] }));

    expect(cache.peek()).toBeUndefined();

    await cache.get();

    expect(cache.peek()).toEqual([league()]);
  });

  it('asks the API once for requests made close together', async () => {
    const leagues = vi.fn(async () => [league()]);
    const cache = new LeaguesCache(fakeApi({ leagues }));

    await Promise.all([cache.get(), cache.get()]);
    await cache.get();

    expect(leagues).toHaveBeenCalledTimes(1);
  });

  it('refreshes an old list but still shows the old one meanwhile', async () => {
    let now = 0;
    const leagues = vi
      .fn<() => Promise<ReturnType<typeof league>[]>>()
      .mockResolvedValueOnce([league({ name: 'Old' })])
      .mockResolvedValueOnce([league({ name: 'New' })]);
    const cache = new LeaguesCache(fakeApi({ leagues }), () => now);
    await cache.get();

    now = 6 * 60_000;
    const refreshing = cache.get();

    expect(cache.peek()?.[0]?.name).toBe('Old');
    await refreshing;
    expect(cache.peek()?.[0]?.name).toBe('New');
  });

  it('tries again after a failure instead of remembering it', async () => {
    const leagues = vi
      .fn<() => Promise<ReturnType<typeof league>[]>>()
      .mockRejectedValueOnce(new ApiError(0, 'network_error'))
      .mockResolvedValueOnce([league()]);
    const cache = new LeaguesCache(fakeApi({ leagues }));

    await expect(cache.get()).rejects.toThrow();
    await expect(cache.get()).resolves.toEqual([league()]);
    expect(cache.peek()).toEqual([league()]);
  });
});
