import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import LuckView from '@/components/LuckView.svelte';
import { seasonReport } from './helpers';

const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
});

afterAll(() => {
  if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalWidth);
});

function renderLuck(season = seasonReport()) {
  return render(LuckView, { season });
}

describe('the luck map', () => {
  it('has one dot per team, each described in words', () => {
    renderLuck();

    const dots = screen.getAllByRole('img', { name: /scoring earned/ });

    expect(dots).toHaveLength(8);
    expect(
      screen.getByRole('img', {
        name: 'Team 6: scoring earned 10.0 wins, record 8-6, unlucky by 2.0 wins, for real',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Team 5: scoring earned 10.7 wins, record 13-1, lucky by 2.3 wins, for real',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Team 2: scoring earned 7.3 wins, record 8-6, record matches scoring',
      }),
    ).toBeInTheDocument();
  });

  it('rings the teams that are for real', () => {
    const { container } = renderLuck();

    expect(container.querySelectorAll('.dot .ring')).toHaveLength(2);
  });

  it('colors dots by polarity', () => {
    const { container } = renderLuck();

    expect(container.querySelectorAll('.mark.lucky')).toHaveLength(2);
    expect(container.querySelectorAll('.mark.unlucky')).toHaveLength(2);
    expect(container.querySelectorAll('.mark.even')).toHaveLength(4);
  });

  it('draws the record-matches-scoring diagonal and a legend', () => {
    const { container } = renderLuck();

    expect(container.querySelector('line.diagonal')).toBeInTheDocument();
    const legend = screen.getAllByRole('list', { name: 'Legend' })[0] as HTMLElement;
    expect(within(legend).getByText('Lucky')).toBeInTheDocument();
    expect(within(legend).getByText('Unlucky')).toBeInTheDocument();
    expect(within(legend).getByText('For real')).toBeInTheDocument();
  });

  it('names the dots that matter beside them', () => {
    const { container } = renderLuck();

    const labels = [...container.querySelectorAll('text.label')].map((label) =>
      label.textContent?.trim(),
    );

    expect(labels).toContain('Team 5');
    expect(labels).toContain('Team 6');
  });

  it('shows the same numbers as a table', async () => {
    renderLuck();
    const [toggle] = screen.getAllByRole('button', { name: 'Table' });

    await userEvent.click(toggle as HTMLElement);

    const rows = screen.getAllByRole('row');
    expect(within(rows[0] as HTMLElement).getAllByRole('columnheader')).toHaveLength(4);
    const team6 = rows.find((row) => within(row).queryByText('Team 6')) as HTMLElement;
    expect(
      within(team6)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['8-6', '10.0 wins', '−2.0 wins']);
    expect(screen.queryByRole('img', { name: /scoring earned/ })).not.toBeInTheDocument();
  });

  it('says so when no games have been played', () => {
    renderLuck({ ...seasonReport(), teams: [], weeks: [] });

    expect(screen.getByText('No games have been played yet.')).toBeInTheDocument();
  });
});

describe('the luck map tooltip', () => {
  function dotOf(container: HTMLElement, team: string) {
    const group = container.querySelector(`[aria-label^="${team}:"]`) as SVGGElement;
    const mark = group.querySelector('.mark') as SVGCircleElement;
    return { x: Number(mark.getAttribute('cx')), y: Number(mark.getAttribute('cy')) };
  }

  function chartOf(container: HTMLElement) {
    return container.querySelector('svg[role="group"]') as SVGSVGElement;
  }

  it('shows a team when the pointer is near its dot, and hides it when the pointer leaves', async () => {
    const { container } = renderLuck();
    const { x, y } = dotOf(container, 'Team 5');

    await fireEvent.pointerMove(chartOf(container), { clientX: x + 6, clientY: y + 4 });

    expect(screen.getByText('Record 13-1')).toBeInTheDocument();
    expect(screen.getByText('Scoring earned 10.7 wins')).toBeInTheDocument();
    expect(screen.getByText('Luck +2.3 wins')).toBeInTheDocument();

    await fireEvent.pointerLeave(chartOf(container), { pointerType: 'mouse' });

    expect(screen.queryByText('Record 13-1')).not.toBeInTheDocument();
  });

  it('shows nothing when the pointer is nowhere near a dot', async () => {
    const { container } = renderLuck();

    await fireEvent.pointerMove(chartOf(container), { clientX: 2, clientY: 2 });

    expect(screen.queryByText(/^Scoring earned/)).not.toBeInTheDocument();
  });

  it('keeps the tooltip after a finger lifts, and drops it on a tap elsewhere', async () => {
    const { container } = renderLuck();
    const { x, y } = dotOf(container, 'Team 6');

    await fireEvent.pointerDown(chartOf(container), {
      clientX: x,
      clientY: y,
      pointerType: 'touch',
    });
    await fireEvent.pointerLeave(chartOf(container), { pointerType: 'touch' });

    expect(screen.getByText('Record 8-6')).toBeInTheDocument();

    await fireEvent.pointerDown(document.body, { pointerType: 'touch' });

    expect(screen.queryByText('Record 8-6')).not.toBeInTheDocument();
  });
});

describe('the schedule dot plot', () => {
  it('lists every team with its schedule in words, easiest first', () => {
    renderLuck();

    const rows = screen.getAllByRole('img', { name: /faced/ });

    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveAccessibleName(
      /^Team 5 faced 119\.7 points per game, [\d.]+ points easier than average$/,
    );
    expect(rows.at(-1)).toHaveAccessibleName(
      /Team 3 faced 126\.0 points per game, [\d.]+ points tougher than average/,
    );
  });

  it('splits teams whose schedule helped from those it hurt', () => {
    const { container } = renderLuck();

    const helped = container.querySelectorAll('.dot.helped').length;
    const hurt = container.querySelectorAll('.dot.hurt').length;

    expect(helped + hurt).toBe(8);
    expect(helped).toBeGreaterThan(0);
    expect(hurt).toBeGreaterThan(0);
  });

  it('shows the full name of a long-named team', () => {
    const long = 'The Extraordinarily Long-Named Gridiron Gladiators of Springfield';
    const base = seasonReport();
    const season = {
      ...base,
      teams: base.teams.map((team) => (team.team_id === 5 ? { ...team, name: long } : team)),
    };

    renderLuck(season);

    expect(screen.getAllByText(long).length).toBeGreaterThan(0);
  });

  it('shows the schedule as a table too', async () => {
    renderLuck();
    const buttons = screen.getAllByRole('button', { name: 'Table' });

    await userEvent.click(buttons[1] as HTMLElement);

    const table = screen.getByRole('table', {
      name: 'Average points scored against each team, easiest schedule first',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(9);
  });
});
