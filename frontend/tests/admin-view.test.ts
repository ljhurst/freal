import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '@/App.svelte';
import type { Api, LeagueAccess } from '@/lib/api/client';
import { Session } from '@/lib/auth/session.svelte';
import { contextFor, FakeOidcClient, fakeApi, fakeUser, services } from './helpers';

const FAMILY: LeagueAccess = {
  league_id: 7,
  name: 'Family League',
  members: [{ sub: 'abc', label: 'Dana' }],
};

async function renderAdmin(scopes: string[], overrides: Partial<Api> = {}) {
  const client = new FakeOidcClient();
  client.user = fakeUser({ scopes });
  const session = new Session(client);
  const api = fakeApi({ access: async () => [structuredClone(FAMILY)], ...overrides });
  render(App, { context: contextFor(services({ path: '/admin', api, session })) });
  await session.start();
}

describe('the access page', () => {
  it('lists each league with its members', async () => {
    await renderAdmin(['freal:read', 'freal:admin']);

    expect(await screen.findByText('Family League')).toBeInTheDocument();
    expect(screen.getByText('Dana')).toBeInTheDocument();
    expect(screen.getByText('abc')).toBeInTheDocument();
  });

  it('adds a member and saves the whole list', async () => {
    const setMembers = vi.fn(async () => {});
    await renderAdmin(['freal:read', 'freal:admin'], { setMembers });
    await screen.findByText('Family League');

    await userEvent.type(screen.getByLabelText(/Name for the new member/), 'Sam');
    await userEvent.type(screen.getByLabelText(/Lasso ID of the new member/), 'def');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(setMembers).toHaveBeenCalledWith(7, [
      { sub: 'abc', label: 'Dana' },
      { sub: 'def', label: 'Sam' },
    ]);
    expect(await screen.findByText('Sam')).toBeInTheDocument();
  });

  it('removes a member', async () => {
    const setMembers = vi.fn(async () => {});
    await renderAdmin(['freal:read', 'freal:admin'], { setMembers });
    const row = (await screen.findByText('Dana')).closest('li') as HTMLElement;

    await userEvent.click(within(row).getByRole('button', { name: /Remove Dana/ }));

    expect(setMembers).toHaveBeenCalledWith(7, []);
    expect(await screen.findByText('Only admins can see this league.')).toBeInTheDocument();
  });

  it('keeps the list unchanged and shows the error when saving fails', async () => {
    const setMembers = vi.fn(async () => {
      throw new Error('boom');
    });
    await renderAdmin(['freal:read', 'freal:admin'], { setMembers });
    const row = (await screen.findByText('Dana')).closest('li') as HTMLElement;

    await userEvent.click(within(row).getByRole('button', { name: /Remove Dana/ }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Dana')).toBeInTheDocument();
  });

  it('does not ask the API for anyone who is not an admin', async () => {
    const access = vi.fn(async () => [FAMILY]);
    await renderAdmin(['freal:read'], { access });

    expect(
      await screen.findByText('Only admins can change who sees a league.'),
    ).toBeInTheDocument();
    expect(access).not.toHaveBeenCalled();
  });
});
