import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApi } from '@/lib/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function setup(options: { token?: string | null; response?: Response | Error } = {}) {
  const fetchMock = vi.fn(async () => {
    const response = options.response ?? jsonResponse([]);
    if (response instanceof Error) {
      throw response;
    }
    return response;
  });
  const onUnauthorized = vi.fn(async () => {});
  const api = createApi({
    baseUrl: 'https://api.test',
    accessToken: async () => (options.token === undefined ? 'tok' : options.token),
    onUnauthorized,
    fetch: fetchMock as unknown as typeof fetch,
  });
  return { api, fetchMock, onUnauthorized };
}

describe('createApi', () => {
  it('reads the API version from the version route', async () => {
    const { api, fetchMock } = setup({ response: jsonResponse({ version: '1.2.3' }) });

    await expect(api.version()).resolves.toBe('1.2.3');

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/version', {
      headers: { Authorization: 'Bearer tok' },
    });
  });

  it('sends the bearer token and returns the leagues', async () => {
    const leagues = [{ league_id: 7, name: 'Family', years: [2025] }];
    const { api, fetchMock } = setup({ response: jsonResponse(leagues) });

    await expect(api.leagues()).resolves.toEqual(leagues);

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/leagues', {
      headers: { Authorization: 'Bearer tok' },
    });
  });

  it("replaces a league's members with a JSON PUT", async () => {
    const { api, fetchMock } = setup({ response: new Response(null, { status: 204 }) });

    await api.setMembers(7, [{ sub: 'abc', label: 'Dana' }]);

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/admin/leagues/7/members', {
      method: 'PUT',
      headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: [{ sub: 'abc', label: 'Dana' }] }),
    });
  });

  it('requests the season for a league and year', async () => {
    const { api, fetchMock } = setup({ response: jsonResponse({ year: 2025 }) });

    await api.season(7, 2025);

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/leagues/7/seasons/2025', {
      headers: { Authorization: 'Bearer tok' },
    });
  });

  it('turns an error body into an ApiError', async () => {
    const { api, onUnauthorized } = setup({
      response: jsonResponse({ error: 'espn_auth_expired' }, 502),
    });

    await expect(api.season(7, 2025)).rejects.toMatchObject({
      status: 502,
      code: 'espn_auth_expired',
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('asks to sign in again when the API says the token is invalid', async () => {
    const { api, onUnauthorized } = setup({
      response: jsonResponse({ error: 'invalid_token' }, 401),
    });

    await expect(api.leagues()).rejects.toMatchObject({ status: 401, code: 'invalid_token' });

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('asks to sign in without calling the API when there is no token', async () => {
    const { api, fetchMock, onUnauthorized } = setup({ token: null });

    await expect(api.leagues()).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('reports a failed request as a network error', async () => {
    const { api } = setup({ response: new TypeError('Failed to fetch') });

    await expect(api.leagues()).rejects.toMatchObject({ status: 0, code: 'network_error' });
  });

  it('copes with an error response that is not JSON', async () => {
    const { api } = setup({ response: new Response('<html>bad gateway</html>', { status: 502 }) });

    await expect(api.leagues()).rejects.toMatchObject({ status: 502, code: 'unknown' });
  });
});
