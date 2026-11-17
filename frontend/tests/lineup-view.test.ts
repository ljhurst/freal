import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import LineupsView from '@/components/LineupsView.svelte';
import { seasonReport } from './helpers';

function renderLineups(season = seasonReport()) {
  return render(LineupsView, { season });
}

describe('the lineups chart', () => {
  it('has a row per team, best manager first, each described in words', () => {
    renderLineups();

    const rows = screen.getAllByRole('img', { name: /possible/ });

    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveAccessibleName(
      'Team 6 (champion) scored 1,930.1 of a possible 2,086.6 points, 92.5%, missing 156.5 points',
    );
    expect(rows.at(-1)).toHaveAccessibleName(/^Team 3 scored 1,409\.6 of a possible 1,772\.0/);
  });

  it("puts a trophy beside the champion's name and nobody else's", () => {
    renderLineups();

    const trophies = screen.getAllByRole('img', { name: 'Champion' });

    expect(trophies).toHaveLength(1);
    expect(trophies[0]?.closest('li')).toHaveTextContent('Team 6');
  });

  it('shows no trophy when no team has won the season yet', () => {
    const season = seasonReport();
    renderLineups({
      ...season,
      teams: season.teams.map((team) => ({ ...team, final_rank: null })),
    });

    expect(screen.queryByRole('img', { name: 'Champion' })).not.toBeInTheDocument();
  });

  it('prints the efficiency and the points missed on every row', () => {
    renderLineups();

    expect(screen.getByText('92.5%')).toBeInTheDocument();
    expect(screen.getByText('156.5 missed')).toBeInTheDocument();
    expect(screen.getByText('79.5%')).toBeInTheDocument();
    expect(screen.getByText('362.4 missed')).toBeInTheDocument();
  });

  it('draws scored and missed on one scale, so the longest bar fills the track', () => {
    const { container } = renderLineups();

    const widths = [...container.querySelectorAll('.track')].map((track) => {
      const scored = (track.querySelector('.scored') as HTMLElement).style.width;
      const missed = (track.querySelector('.missed') as HTMLElement).style.width;
      return Number.parseFloat(scored) + Number.parseFloat(missed);
    });

    expect(Math.max(...widths)).toBeCloseTo(100, 4);
    expect(Math.min(...widths)).toBeGreaterThan(70);
  });

  it('sizes a bar from its own numbers: Team 6 scored 1,930.1 and missed 156.5 of a 2,267.6 scale', () => {
    const { container } = renderLineups();

    const track = container.querySelector('.track') as HTMLElement;
    const scored = Number.parseFloat((track.querySelector('.scored') as HTMLElement).style.width);
    const missed = Number.parseFloat((track.querySelector('.missed') as HTMLElement).style.width);

    expect(scored).toBeCloseTo((1930.1 / 2267.6) * 100, 1);
    expect(missed).toBeCloseTo((156.5 / 2267.6) * 100, 1);
  });

  it('explains what the bar ends mean', () => {
    renderLineups();

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(within(legend).getByText('Points scored')).toBeInTheDocument();
    expect(
      within(legend).getByText('Points missed (the bar ends at your best possible lineups)'),
    ).toBeInTheDocument();
  });

  it('shows the same numbers as a table', async () => {
    renderLineups();

    await userEvent.click(screen.getByRole('button', { name: 'Table' }));

    const rows = screen.getAllByRole('row');
    expect(within(rows[0] as HTMLElement).getAllByRole('columnheader')).toHaveLength(5);
    const team6 = rows.find((row) => within(row).queryByText('Team 6 (champion)')) as HTMLElement;
    expect(
      within(team6)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1,930.1', '2,086.6', '156.5', '92.5%']);
  });

  it('shows the full name of a long-named team', () => {
    const long = 'The Extraordinarily Long-Named Gridiron Gladiators of Springfield';
    const base = seasonReport();
    const season = {
      ...base,
      teams: base.teams.map((team) => (team.team_id === 5 ? { ...team, name: long } : team)),
    };

    renderLineups(season);

    expect(screen.getByText(long)).toBeInTheDocument();
  });

  it('says so when no lineups have been set', () => {
    renderLineups({ ...seasonReport(), teams: [], weeks: [] });

    expect(screen.getByText('No lineups have been set yet.')).toBeInTheDocument();
  });
});
