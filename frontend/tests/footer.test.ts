import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import App from '@/App.svelte';
import { Session } from '@/lib/auth/session.svelte';
import { version } from '../package.json';
import { contextFor, FakeOidcClient, fakeApi, fakeUser, services } from './helpers';

function signedIn() {
  const client = new FakeOidcClient();
  client.user = fakeUser();
  return { session: new Session(client) };
}

describe('the footer', () => {
  it('shows the site and API versions once signed in', async () => {
    const { session } = signedIn();
    const api = fakeApi({ version: async () => '4.5.6' });

    render(App, { context: contextFor(services({ api, session })) });

    const footer = await screen.findByRole('contentinfo');
    await waitFor(() => expect(footer).toHaveTextContent(`site v${version} · api v4.5.6`));
  });

  it('shows only the site version when the API cannot be asked', async () => {
    const { session } = signedIn();
    const api = fakeApi({ version: () => Promise.reject(new Error('offline')) });

    render(App, { context: contextFor(services({ api, session })) });

    expect(await screen.findByRole('contentinfo')).toHaveTextContent(
      new RegExp(`^site v${version}$`),
    );
  });

  it('does not ask a signed-out visitor for the API version', async () => {
    let asked = 0;
    const api = fakeApi({
      version: async () => {
        asked += 1;
        return '1.0.0';
      },
    });
    const session = new Session(new FakeOidcClient());

    render(App, { context: contextFor(services({ api, session })) });
    await screen.findByRole('button', { name: 'Log in' });

    expect(screen.getByRole('contentinfo')).toHaveTextContent(new RegExp(`^site v${version}$`));
    expect(asked).toBe(0);
  });
});
