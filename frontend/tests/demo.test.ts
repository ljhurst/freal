import { describe, expect, it, vi } from 'vitest';
import { createDemoApi, isDemoMode } from '@/lib/api/demo';

describe('isDemoMode', () => {
  it.each([
    [{ hostname: 'freal-pr-12.preview.bylukehurst.com', search: '' }, true],
    [{ hostname: 'localhost', search: '?demo' }, true],
    [{ hostname: 'freal.bylukehurst.com', search: '?demo=1' }, true],
    [{ hostname: 'freal.bylukehurst.com', search: '' }, false],
    [{ hostname: 'localhost', search: '?year=2025' }, false],
    [{ hostname: 'preview.bylukehurst.com.evil.example', search: '' }, false],
  ])('%j is %s', (location, expected) => {
    expect(isDemoMode(location)).toBe(expected);
  });
});

describe('createDemoApi', () => {
  it('serves the sample leagues and season from static files', async () => {
    const fetchMock = vi.fn(async (path: string) =>
      Response.json(path.includes('leagues') ? [{ league_id: 1 }] : { year: 2025 }),
    );
    const api = createDemoApi(fetchMock as unknown as typeof fetch);

    await expect(api.leagues()).resolves.toEqual([{ league_id: 1 }]);
    await expect(api.season(1, 2025)).resolves.toEqual({ year: 2025 });

    expect(fetchMock).toHaveBeenCalledWith('/demo/leagues.json');
    expect(fetchMock).toHaveBeenCalledWith('/demo/season-2025.json');
  });

  it('reports a season with no sample data as not found', async () => {
    const api = createDemoApi((async () => new Response('', { status: 404 })) as typeof fetch);

    await expect(api.season(1, 2019)).rejects.toMatchObject({ code: 'season_not_found' });
  });
});
