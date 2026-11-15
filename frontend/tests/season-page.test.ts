import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '@/App.svelte';
import { contextFor, fakeApi, league, seasonReport, services } from './helpers';

function renderSeason(path: string, leagues = [league({ league_id: 1, years: [2024, 2025] })]) {
  const appServices = services({
    path,
    api: fakeApi({ leagues: async () => leagues, season: async () => seasonReport() }),
  });
  render(App, { context: contextFor(appServices) });
  return appServices;
}

describe('the season page', () => {
  it('opens on the overview with every view one tap away', async () => {
    renderSeason('/leagues/1/2025');

    expect(await screen.findByRole('heading', { name: 'Demo League' })).toBeInTheDocument();
    const tabs = screen.getByRole('navigation', { name: 'Season views' });
    expect(within(tabs).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((tab) => tab.textContent?.trim()),
    ).toEqual(['Overview', 'Luck', 'Lineups', 'Weekly']);
  });

  it('switches views without leaving the page or fetching the season again', async () => {
    let fetches = 0;
    const appServices = services({
      path: '/leagues/1/2025',
      api: fakeApi({
        leagues: async () => [league({ league_id: 1 })],
        season: async () => {
          fetches += 1;
          return seasonReport();
        },
      }),
    });
    render(App, { context: contextFor(appServices) });

    await userEvent.click(await screen.findByRole('link', { name: 'Luck' }));

    expect(window.location.pathname).toBe('/leagues/1/2025/luck');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Luck' })).toHaveAttribute('aria-current', 'page');
    expect(fetches).toBe(1);
  });

  it('opens straight on a view from its address', async () => {
    renderSeason('/leagues/1/2025/weekly');

    expect(await screen.findByRole('heading', { name: 'Week by week' })).toBeInTheDocument();
  });

  it('puts words on every team and the stamp only on teams that are for real', async () => {
    renderSeason('/leagues/1/2025');

    const rows = (await screen.findAllByRole('row')).slice(1);
    const chips = rows.map((row) =>
      within(row)
        .getAllByText(/^[\u2713\u25B2\u25BC\u25CF]?\s*(For real|Lucky|Unlucky|Good|Average|Bad)$/)
        .map((chip) => chip.textContent?.replace(/^[\u2713\u25B2\u25BC\u25CF]\s*/, '')),
    );
    expect(chips.every((row) => row.length > 0)).toBe(true);
    expect(chips).toEqual([
      ['Lucky', 'For real'],
      ['Lucky'],
      ['Unlucky', 'For real'],
      ['Average'],
      ['Average'],
      ['Average'],
      ['Unlucky'],
      ['Bad'],
    ]);
  });

  it('lets people switch seasons', async () => {
    renderSeason('/leagues/1/2025');

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Season' }), '2024');

    expect(window.location.pathname).toBe('/leagues/1/2024');
  });

  it('keeps the current view when switching seasons', async () => {
    renderSeason('/leagues/1/2025/lineups');

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Season' }), '2024');

    expect(window.location.pathname).toBe('/leagues/1/2024/lineups');
  });

  it('offers a league switch only when there is more than one league', async () => {
    renderSeason('/leagues/1/2025', [
      league({ league_id: 1, name: 'Family', years: [2025] }),
      league({ league_id: 2, name: 'Work', years: [2024, 2025] }),
    ]);

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'League' }), '2');

    expect(window.location.pathname).toBe('/leagues/2/2025');
  });

  it('shows no switchers for a single league with a single season', async () => {
    renderSeason('/leagues/1/2025', [league({ league_id: 1, years: [2025] })]);

    await screen.findByRole('heading', { name: 'Demo League' });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('the app shell', () => {
  it('lets people change the theme from any page', async () => {
    renderSeason('/leagues/1/2025');

    await userEvent.click(await screen.findByRole('button', { name: /Theme: Match system/ }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: /Theme: Dark/ })).toBeInTheDocument();
  });
});
