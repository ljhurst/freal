import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '@/App.svelte';
import { ApiError, createApi } from '@/lib/api/client';
import { Session } from '@/lib/auth/session.svelte';
import {
  contextFor,
  FakeOidcClient,
  fakeApi,
  fakeUser,
  league,
  seasonReport,
  services,
} from './helpers';

function signedIn(path = '/') {
  const client = new FakeOidcClient();
  client.user = fakeUser();
  return { client, session: new Session(client), path };
}

describe('App in demo mode', () => {
  it('shows the demo banner and lists the leagues without any login', async () => {
    const api = fakeApi({ leagues: async () => [league({ name: 'Demo League', years: [2025] })] });

    render(App, { context: contextFor(services({ api })) });

    expect(await screen.findByText('Demo League')).toBeInTheDocument();
    expect(screen.getByText(/Demo data/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2025 season' })).toHaveAttribute(
      'href',
      '/leagues/7/2025',
    );
  });

  it('says so when no leagues are set up', async () => {
    render(App, { context: contextFor(services()) });

    expect(await screen.findByText('No leagues are set up yet.')).toBeInTheDocument();
  });
});

describe('App with a login', () => {
  it('shows a loading state until the stored session is read', () => {
    const { session } = signedIn();

    render(App, { context: contextFor(services({ session })) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('asks signed-out visitors to log in and remembers where they were going', async () => {
    const client = new FakeOidcClient();
    const session = new Session(client);
    render(App, { context: contextFor(services({ session, path: '/leagues/7/2025' })) });

    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }));

    expect(client.redirectedWith).toEqual(['/leagues/7/2025']);
  });

  it('shows the login is under way, and lets people retry if it fails to start', async () => {
    const client = new FakeOidcClient();
    let fail = true;
    client.signinRedirect = () =>
      fail ? Promise.reject(new Error('offline')) : new Promise(() => {});
    render(App, { context: contextFor(services({ session: new Session(client) })) });

    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeEnabled();

    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    const busy = await screen.findByRole('button', { name: 'Logging in' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
  });

  it('greets a signed-in user and lists their leagues', async () => {
    const { session } = signedIn();
    const api = fakeApi({ leagues: async () => [league()] });

    render(App, { context: contextFor(services({ api, session })) });

    expect(await screen.findByText('Family League')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.queryByText(/Demo data/)).not.toBeInTheDocument();
  });

  it('signs the user out', async () => {
    const { client, session } = signedIn();
    render(App, { context: contextFor(services({ session })) });

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(client.signedOut).toBe(true);
  });

  it('finishes the login redirect and returns to the page the user wanted', async () => {
    const client = new FakeOidcClient();
    client.callbackUser = fakeUser({ state: '/leagues/7/2025' });
    const session = new Session(client);
    const api = fakeApi({ season: async () => seasonReport() });
    const appServices = services({ api, session, path: '/auth/callback' });

    render(App, { context: contextFor(appServices) });

    await waitFor(() => expect(window.location.pathname).toBe('/leagues/7/2025'));
    expect(await screen.findByRole('heading', { name: 'Demo League' })).toBeInTheDocument();
  });

  it('offers another try when the login redirect fails', async () => {
    const client = new FakeOidcClient();
    client.signinRedirectCallback = () => Promise.reject(new Error('state mismatch'));
    const session = new Session(client);

    render(App, { context: contextFor(services({ session, path: '/auth/callback' })) });
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(client.redirectedWith).toEqual(['/']);
  });
});

describe('the season page', () => {
  it('ranks teams by wins and shows their record and luck', async () => {
    const api = fakeApi({ season: async () => seasonReport() });

    render(App, { context: contextFor(services({ api, path: '/leagues/1/2025' })) });

    const rows = await screen.findAllByRole('row');
    const names = rows.slice(1).map((row) => within(row).getByRole('rowheader').textContent);
    expect(names).toEqual([
      'Team 5',
      'Team 4',
      'Team 6',
      'Team 2',
      'Team 1',
      'Team 7',
      'Team 8',
      'Team 3',
    ]);
    expect(within(rows[1] as HTMLElement).getByText('13-1')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('+2.3')).toBeInTheDocument();
    expect(within(rows[8] as HTMLElement).getByText('2-12')).toBeInTheDocument();
    expect(within(rows[8] as HTMLElement).getByText('\u22120.9')).toBeInTheDocument();
  });

  it('explains an expired ESPN login instead of showing a blank page', async () => {
    const season = vi.fn(() => Promise.reject(new ApiError(502, 'espn_auth_expired')));

    render(App, {
      context: contextFor(services({ api: fakeApi({ season }), path: '/leagues/7/2025' })),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('ESPN needs a refresh');
  });

  it('says when the account has no access', async () => {
    const season = () => Promise.reject(new ApiError(403, 'insufficient_scope'));

    render(App, {
      context: contextFor(services({ api: fakeApi({ season }), path: '/leagues/7/2025' })),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('No access yet');
  });
});

describe('navigation', () => {
  it('moves between pages without reloading', async () => {
    const api = fakeApi({
      leagues: async () => [league()],
      season: async () => seasonReport(),
    });
    render(App, { context: contextFor(services({ api })) });

    await userEvent.click(await screen.findByRole('link', { name: '2025 season' }));

    expect(await screen.findByRole('heading', { name: 'Demo League' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/leagues/7/2025');
  });

  it('shows a not-found page for unknown addresses', () => {
    render(App, { context: contextFor(services({ path: '/nope' })) });

    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  });
});

describe('when the API rejects a valid-looking token', () => {
  function rejectingSetup() {
    const client = new FakeOidcClient();
    client.user = fakeUser();
    const session = new Session(client);
    const api = createApi({
      baseUrl: 'https://api.test',
      accessToken: () => session.accessToken(),
      onUnauthorized: async () => {
        await session.reauthenticate('/leagues/7/2025');
      },
      fetch: (async () =>
        Response.json({ error: 'invalid_token' }, { status: 401 })) as typeof fetch,
    });
    return { client, session, api };
  }

  it('restarts the login once when no login has happened lately', async () => {
    const { client, session, api } = rejectingSetup();

    render(App, { context: contextFor(services({ api, session, path: '/leagues/7/2025' })) });

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't sign you in");
    expect(client.redirectedWith).toEqual(['/leagues/7/2025']);
  });

  it('shows an error instead of looping when a login just happened', async () => {
    const { client, session, api } = rejectingSetup();
    await session.signIn('/leagues/7/2025');

    render(App, { context: contextFor(services({ api, session, path: '/leagues/7/2025' })) });

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't sign you in");
    expect(client.redirectedWith).toEqual(['/leagues/7/2025']);
  });
});
