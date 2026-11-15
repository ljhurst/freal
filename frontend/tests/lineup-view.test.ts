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
      'Team 6 scored 1,930.1 of a possible 2,086.6 points, 92.5%, leaving 156.5 on the bench',
    );
    expect(rows.at(-1)).toHaveAccessibleName(/^Team 3 scored 1,409\.6 of a possible 1,772\.0/);
  });

  it('prints the efficiency and the bench points on every row', () => {
    renderLineups();

    expect(screen.getByText('92.5%')).toBeInTheDocument();
    expect(screen.getByText('156.5 benched')).toBeInTheDocument();
    expect(screen.getByText('79.5%')).toBeInTheDocument();
    expect(screen.getByText('362.4 benched')).toBeInTheDocument();
  });

  it('draws scored and benched on one scale, so the longest bar fills the track', () => {
    const { container } = renderLineups();

    const widths = [...container.querySelectorAll('.track')].map((track) => {
      const scored = (track.querySelector('.scored') as HTMLElement).style.width;
      const benched = (track.querySelector('.benched') as HTMLElement).style.width;
      return Number.parseFloat(scored) + Number.parseFloat(benched);
    });

    expect(Math.max(...widths)).toBeCloseTo(100, 4);
    expect(Math.min(...widths)).toBeGreaterThan(70);
  });

  it('sizes a bar from its own numbers: Team 6 scored 1,930.1 and benched 156.5 of a 2,267.6 scale', () => {
    const { container } = renderLineups();

    const track = container.querySelector('.track') as HTMLElement;
    const scored = Number.parseFloat((track.querySelector('.scored') as HTMLElement).style.width);
    const benched = Number.parseFloat((track.querySelector('.benched') as HTMLElement).style.width);

    expect(scored).toBeCloseTo((1930.1 / 2267.6) * 100, 1);
    expect(benched).toBeCloseTo((156.5 / 2267.6) * 100, 1);
  });

  it('explains what the bar ends mean', () => {
    renderLineups();

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(within(legend).getByText('Points scored')).toBeInTheDocument();
    expect(
      within(legend).getByText('Left on the bench (the bar ends at the best possible lineup)'),
    ).toBeInTheDocument();
  });

  it('shows the same numbers as a table', async () => {
    renderLineups();

    await userEvent.click(screen.getByRole('button', { name: 'Table' }));

    const rows = screen.getAllByRole('row');
    expect(within(rows[0] as HTMLElement).getAllByRole('columnheader')).toHaveLength(5);
    const team6 = rows.find((row) => within(row).queryByText('Team 6')) as HTMLElement;
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
