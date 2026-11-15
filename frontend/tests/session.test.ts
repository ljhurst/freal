import { describe, expect, it } from 'vitest';
import { Session } from '@/lib/auth/session.svelte';
import { FakeOidcClient, fakeUser } from './helpers';

function setup(user = fakeUser() as ReturnType<typeof fakeUser> | null) {
  const client = new FakeOidcClient();
  client.user = user;
  return { client, session: new Session(client) };
}

describe('Session', () => {
  it('starts out loading', () => {
    expect(setup().session.status).toBe('loading');
  });

  it('is signed in with a valid stored user', async () => {
    const { session } = setup();

    await session.start();

    expect(session.status).toBe('signedIn');
    expect(session.givenName).toBe('Ada');
  });

  it('falls back to the full name when there is no given name', async () => {
    const { session } = setup(fakeUser({ profile: { name: 'Ada Lovelace' } } as never));

    await session.start();

    expect(session.givenName).toBe('Ada Lovelace');
  });

  it.each([
    ['no stored user', null],
    ['an expired user', fakeUser({ expired: true })],
  ])('is signed out with %s', async (_label, user) => {
    const { session } = setup(user);

    await session.start();

    expect(session.status).toBe('signedOut');
    expect(session.givenName).toBe('');
  });

  it('remembers where the user was heading when signing in', async () => {
    const { client, session } = setup(null);

    await session.signIn('/leagues/7/2025?x=1');

    expect(client.redirectedWith).toEqual(['/leagues/7/2025?x=1']);
  });

  it('returns the remembered path after the login redirect', async () => {
    const { client, session } = setup(null);
    client.callbackUser = fakeUser({ state: '/leagues/7/2025' });

    await expect(session.completeSignIn()).resolves.toBe('/leagues/7/2025');
    expect(session.status).toBe('signedIn');
  });

  it('goes home after login when nothing was remembered', async () => {
    const { session } = setup(null);

    await expect(session.completeSignIn()).resolves.toBe('/');
  });

  it('hands out the access token while it is valid', async () => {
    const { session } = setup();

    await expect(session.accessToken()).resolves.toBe('token-123');
  });

  it('refuses a token that has expired and marks the user signed out', async () => {
    const { session } = setup(fakeUser({ expired: true }));

    await expect(session.accessToken()).resolves.toBeNull();
    expect(session.status).toBe('signedOut');
  });

  it('signs out through the identity provider', async () => {
    const { client, session } = setup();

    await session.signOut();

    expect(client.signedOut).toBe(true);
  });

  describe('after the API rejects a token', () => {
    function timed(start = 1_000_000) {
      const client = new FakeOidcClient();
      let now = start;
      const session = new Session(client, sessionStorage, () => now);
      return { client, session, advance: (ms: number) => (now += ms) };
    }

    it('restarts the login when none was started recently', async () => {
      const { client, session } = timed();

      await expect(session.reauthenticate('/leagues/7/2025')).resolves.toBe(true);

      expect(client.redirectedWith).toEqual(['/leagues/7/2025']);
    });

    it('does not start another login right after one, which would loop', async () => {
      const { client, session } = timed();
      await session.signIn('/');

      await expect(session.reauthenticate('/')).resolves.toBe(false);

      expect(client.redirectedWith).toEqual(['/']);
    });

    it('does not loop on its own redirects either', async () => {
      const { client, session, advance } = timed();
      await session.reauthenticate('/');
      advance(5_000);

      await expect(session.reauthenticate('/')).resolves.toBe(false);

      expect(client.redirectedWith).toHaveLength(1);
    });

    it('restarts the login again once a minute has passed', async () => {
      const { client, session, advance } = timed();
      await session.reauthenticate('/');
      advance(60_000);

      await expect(session.reauthenticate('/')).resolves.toBe(true);

      expect(client.redirectedWith).toHaveLength(2);
    });

    it('never blocks a person who clicks Log in', async () => {
      const { client, session } = timed();
      await session.signIn('/');

      await session.signIn('/');

      expect(client.redirectedWith).toHaveLength(2);
    });
  });
});
