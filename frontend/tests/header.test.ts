import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '@/App.svelte';
import { Session } from '@/lib/auth/session.svelte';
import { BRAND_NAME } from '@/lib/brand';
import indexHtml from '../index.html?raw';
import {
  contextFor,
  FakeOidcClient,
  fakeApi,
  fakeUser,
  league,
  seasonReport,
  services,
} from './helpers';

function renderAt(path: string, session: Session | null = null) {
  const api = fakeApi({
    leagues: async () => [league({ league_id: 1 })],
    season: async () => seasonReport(),
  });
  const appServices = services({ path, api, session });
  render(App, { context: contextFor(appServices) });
  return appServices;
}

describe('the page title', () => {
  it('is the brand name', () => {
    expect(indexHtml).toContain(`<title>${BRAND_NAME}</title>`);
  });
});

describe('the header', () => {
  it("shows the F'Real wordmark", () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: BRAND_NAME })).toHaveAttribute('href', '/');
    expect(BRAND_NAME).toBe("F'Real");
  });

  it('has a Leagues tab that is current on the league list', () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: 'Leagues' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps the Leagues tab marked inside a season, and one tap goes back to the list', async () => {
    renderAt('/leagues/1/2025');
    const tab = await screen.findByRole('link', { name: 'Leagues' });

    expect(tab).toHaveAttribute('aria-current', 'true');

    await userEvent.click(tab);

    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('link', { name: 'Leagues' })).toHaveAttribute('aria-current', 'page');
  });

  it('has no Leagues tab for someone who is signed out', async () => {
    const session = new Session(new FakeOidcClient());

    renderAt('/', session);
    await screen.findByRole('button', { name: 'Log in' });

    expect(screen.queryByRole('link', { name: 'Leagues' })).not.toBeInTheDocument();
  });

  it('has the Leagues tab once signed in', async () => {
    const client = new FakeOidcClient();
    client.user = fakeUser();

    renderAt('/', new Session(client));

    expect(await screen.findByRole('link', { name: 'Leagues' })).toBeInTheDocument();
  });
});
