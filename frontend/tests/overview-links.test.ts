import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '@/App.svelte';
import { contextFor, fakeApi, league, seasonReport, services } from './helpers';

function renderOverview(path = '/leagues/1/2025', season = seasonReport()) {
  const appServices = services({
    path,
    api: fakeApi({
      leagues: async () => [league({ league_id: 1, years: [2025] })],
      season: async () => season,
    }),
  });
  render(App, { context: contextFor(appServices) });
}

async function tile(label: string): Promise<HTMLElement> {
  const eyebrow = await screen.findByText(label);
  return eyebrow.closest('a') as HTMLElement;
}

describe('the standout tiles', () => {
  it('link to the tab that explains each one', async () => {
    renderOverview();

    expect(await tile('Luckiest')).toHaveAttribute('href', '/leagues/1/2025/luck');
    expect(await tile('Unluckiest')).toHaveAttribute('href', '/leagues/1/2025/luck');
    expect(await tile('Best manager')).toHaveAttribute('href', '/leagues/1/2025/lineups');
  });

  it('open Weekly with the team the tile is about already selected', async () => {
    renderOverview();

    expect(await tile('Top week')).toHaveAttribute('href', '/leagues/1/2025/weekly?team=6');
    expect(await tile('Steadiest')).toHaveAttribute('href', '/leagues/1/2025/weekly?team=1');
  });

  it('still read as one phrase to a screen reader', async () => {
    renderOverview();

    const luckiest = await tile('Luckiest');

    expect(luckiest).toHaveAccessibleName(/^Luckiest\s+Team 5\s+\+2\.3 wins\s*$/);
  });

  it('go there without reloading the page, with that team picked', async () => {
    renderOverview();

    await userEvent.click(await tile('Steadiest'));

    expect(window.location.pathname + window.location.search).toBe('/leagues/1/2025/weekly?team=1');
    const group = await screen.findByRole('group', { name: 'Team to highlight' });
    expect(
      within(group)
        .getAllByRole('button')
        .find((button) => button.getAttribute('aria-pressed') === 'true'),
    ).toHaveTextContent('Team 1');
  });
});

describe('teams on the overview', () => {
  it('link from the for-real list to their season', async () => {
    renderOverview();

    const hero = (await screen.findByRole('heading', { name: "Who's for real?" })).closest(
      'section',
    ) as HTMLElement;

    expect(within(hero).getByRole('link', { name: 'Team 5' })).toHaveAttribute(
      'href',
      '/leagues/1/2025/weekly?team=5',
    );
    expect(within(hero).getByRole('link', { name: /^Team 6/ })).toHaveAttribute(
      'href',
      '/leagues/1/2025/weekly?team=6',
    );
  });

  it('link from every standings row to that team on Weekly', async () => {
    renderOverview();

    const rows = (await screen.findAllByRole('row')).slice(1);

    expect(rows).toHaveLength(8);
    const hrefs = rows.map((row) =>
      within(row).getByRole('rowheader').querySelector('a')?.getAttribute('href'),
    );
    expect(hrefs.every((href) => /^\/leagues\/1\/2025\/weekly\?team=\d+$/.test(href ?? ''))).toBe(
      true,
    );
    expect(new Set(hrefs).size).toBe(8);
  });

  it('link from the Luck, Lineup and Trend headers to their tabs', async () => {
    renderOverview();

    const headers = await screen.findAllByRole('columnheader');
    const hrefOf = (name: string) =>
      within(headers.find((header) => header.textContent?.trim() === name) as HTMLElement)
        .getByRole('link')
        .getAttribute('href');

    expect(hrefOf('Luck')).toBe('/leagues/1/2025/luck');
    expect(hrefOf('Lineup')).toBe('/leagues/1/2025/lineups');
    expect(hrefOf('Trend')).toBe('/leagues/1/2025/weekly');
  });

  it('show a long team name in full as a link', async () => {
    const long = 'The Extraordinarily Long-Named Gridiron Gladiators of Springfield';
    const base = seasonReport();
    renderOverview('/leagues/1/2025', {
      ...base,
      teams: base.teams.map((team) => (team.team_id === 5 ? { ...team, name: long } : team)),
    });

    const links = await screen.findAllByRole('link', { name: long });

    expect(links).toHaveLength(2);
    for (const entry of links) {
      expect(entry).toHaveAttribute('href', '/leagues/1/2025/weekly?team=5');
    }
    expect(screen.getAllByText(long).length).toBeGreaterThanOrEqual(3);
  });
});
