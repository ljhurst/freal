import { render, screen, waitFor, within } from '@testing-library/svelte';
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

    expect(await screen.findByRole('heading', { name: 'Family League' })).toBeInTheDocument();
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

    await userEvent.click(await screen.findByRole('link', { name: 'Weekly' }));

    expect(window.location.pathname).toBe('/leagues/1/2025/weekly');
    expect(
      await screen.findByRole('heading', { name: 'How did the season unfold?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Weekly' })).toHaveAttribute('aria-current', 'page');
    expect(fetches).toBe(1);
  });

  it('opens straight on a view from its address', async () => {
    renderSeason('/leagues/1/2025/weekly');

    expect(
      await screen.findByRole('heading', { name: 'How did the season unfold?' }),
    ).toBeInTheDocument();
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

  it('leads with the teams that are for real and five season standouts', async () => {
    renderSeason('/leagues/1/2025');

    const hero = (await screen.findByRole('heading', { name: "Who's for real?" })).closest(
      'section',
    );
    expect(
      within(hero as HTMLElement)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace(/^\u2713/, '')),
    ).toEqual(['Team 5', 'Team 6']);
    for (const label of ['Luckiest', 'Unluckiest', 'Best manager', 'Top week', 'Steadiest']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('says what each standout number measures', async () => {
    renderSeason('/leagues/1/2025');

    expect(await screen.findByText('92.5% of optimal points')).toBeInTheDocument();
    expect(screen.getByText('187.9 points in week 12')).toBeInTheDocument();
    expect(screen.getByText('±13.1 points per week')).toBeInTheDocument();
  });

  it('draws one trend point per game played in every standings row', async () => {
    renderSeason('/leagues/1/2025');

    const rows = (await screen.findAllByRole('row')).slice(1);

    expect(rows).toHaveLength(8);
    for (const row of rows) {
      const trend = within(row).getByRole('img', { name: /^Weekly points over 14 games/ });
      expect(trend.querySelector('polyline')?.getAttribute('points')?.split(' ')).toHaveLength(14);
    }
  });

  it('shows the full name of a long-named team in the tiles', async () => {
    const long = 'The Extraordinarily Long-Named Gridiron Gladiators of Springfield';
    const report = seasonReport();
    const renamed = {
      ...report,
      teams: report.teams.map((team) => (team.for_real ? { ...team, name: long } : team)),
    };
    render(App, {
      context: contextFor(
        services({
          path: '/leagues/1/2025',
          api: fakeApi({
            leagues: async () => [league({ league_id: 1 })],
            season: async () => renamed,
          }),
        }),
      ),
    });

    expect((await screen.findAllByText(long)).length).toBeGreaterThan(2);
  });

  it('leaves the season to the dropdown when there are several', async () => {
    renderSeason('/leagues/1/2025');

    await screen.findByRole('combobox', { name: 'Season' });

    expect(screen.queryByText('2025 season')).not.toBeInTheDocument();
  });

  it('names the season above the league when there is nothing to switch', async () => {
    renderSeason('/leagues/1/2025', [league({ league_id: 1, years: [2025] })]);

    expect(await screen.findByText('2025 season')).toBeInTheDocument();
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

    await screen.findByRole('heading', { name: 'Family League' });

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

function slowSeason() {
  const release: { resolve: () => void } = { resolve: () => {} };
  const gate = new Promise<void>((resolve) => {
    release.resolve = resolve;
  });
  return { release, gate };
}

describe('switching seasons', () => {
  function renderSlow(leagues = [league({ league_id: 1, years: [2024, 2025] })]) {
    const { release, gate } = slowSeason();
    let first = true;
    const appServices = services({
      path: '/leagues/1/2025',
      api: fakeApi({
        leagues: async () => leagues,
        season: async () => {
          if (first) {
            first = false;
            return seasonReport();
          }
          await gate;
          return seasonReport();
        },
      }),
    });
    render(App, { context: contextFor(appServices) });
    return release;
  }

  it('keeps the league name, tabs and pickers while the next season loads', async () => {
    renderSlow();
    await screen.findByText('Standings');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Season' }), '2024');

    expect(await screen.findByRole('status')).toHaveTextContent('Loading the 2024 season');
    expect(screen.getByRole('heading', { name: 'Family League' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Season views' })).toBeInTheDocument();
    expect(screen.queryByText('Standings')).not.toBeInTheDocument();
  });

  it('disables the season picker until the season arrives', async () => {
    const release = renderSlow();
    await screen.findByText('Standings');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Season' }), '2024');

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Season' })).toBeDisabled());
    release.resolve();
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Season' })).toBeEnabled());
    expect(await screen.findByText('Standings')).toBeInTheDocument();
  });

  it('keeps the tabs usable while loading', async () => {
    renderSlow();
    await screen.findByText('Standings');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Season' }), '2024');
    await userEvent.click(screen.getByRole('link', { name: 'Luck' }));

    expect(window.location.pathname).toBe('/leagues/1/2024/luck');
    expect(screen.getByRole('link', { name: 'Luck' })).toHaveAttribute('aria-current', 'page');
  });

  it('loads a skeleton of bar rows on the lineups view', async () => {
    const { release, gate } = slowSeason();
    const appServices = services({
      path: '/leagues/1/2025/lineups',
      api: fakeApi({
        leagues: async () => [league({ league_id: 1, years: [2024, 2025] })],
        season: async () => {
          await gate;
          return seasonReport();
        },
      }),
    });
    const { container } = render(App, { context: contextFor(appServices) });

    await screen.findByRole('status');
    expect(container.querySelectorAll('section.card')).toHaveLength(1);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThanOrEqual(9);

    release.resolve();
    expect(
      await screen.findByRole('heading', { name: 'Who sets the best lineup?' }),
    ).toBeInTheDocument();
  });

  it('loads a skeleton shaped like the view it is on', async () => {
    const { release, gate } = slowSeason();
    const appServices = services({
      path: '/leagues/1/2025/luck',
      api: fakeApi({
        leagues: async () => [league({ league_id: 1, years: [2024, 2025] })],
        season: async () => {
          await gate;
          return seasonReport();
        },
      }),
    });
    const { container } = render(App, { context: contextFor(appServices) });

    await screen.findByRole('status');
    expect(container.querySelectorAll('section.card')).toHaveLength(2);

    release.resolve();
    expect(await screen.findByRole('heading', { name: 'Who got the breaks?' })).toBeInTheDocument();
  });

  it('still shows the page when the leagues list cannot be fetched', async () => {
    const appServices = services({
      path: '/leagues/1/2025',
      api: fakeApi({
        leagues: async () => {
          throw new Error('offline');
        },
        season: async () => seasonReport(),
      }),
    });
    render(App, { context: contextFor(appServices) });

    expect(await screen.findByText('Standings')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'League' })).toBeInTheDocument();
  });
});
