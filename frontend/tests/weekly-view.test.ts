import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import App from '@/App.svelte';
import { contextFor, fakeApi, league, seasonReport, services } from './helpers';

const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
});

afterAll(() => {
  if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalWidth);
});

function renderWeekly(path = '/leagues/1/2025/weekly', season = seasonReport()) {
  const appServices = services({
    path,
    api: fakeApi({
      leagues: async () => [league({ league_id: 1, years: [2025] })],
      season: async () => season,
    }),
  });
  return render(App, { context: contextFor(appServices) });
}

function pressed(): string | undefined {
  const group = screen.getByRole('group', { name: 'Team to highlight' });
  return within(group)
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-pressed') === 'true')
    ?.textContent?.trim();
}

describe('the team chips', () => {
  it('has a chip per team, with the first team that is for real selected', async () => {
    renderWeekly();

    const group = await screen.findByRole('group', { name: 'Team to highlight' });

    expect(within(group).getAllByRole('button')).toHaveLength(8);
    expect(pressed()).toBe('Team 5');
  });

  it("puts a trophy on the champion's chip and no other", async () => {
    renderWeekly();

    const group = await screen.findByRole('group', { name: 'Team to highlight' });

    const trophies = within(group).getAllByRole('img', { name: 'Champion' });
    expect(trophies).toHaveLength(1);
    expect(trophies[0]?.closest('button')).toHaveTextContent('Team 6');
  });

  it("draws a trophy at the end of the champion's line when they are selected", async () => {
    const { container } = renderWeekly('/leagues/1/2025/weekly?team=6');

    await screen.findByRole('group', { name: 'Team to highlight' });

    const chart = container.querySelector('svg[role="group"]') as SVGSVGElement;
    expect(chart.querySelectorAll('svg[role="img"][aria-label="Champion"]')).toHaveLength(1);
  });

  it('draws no trophy on the line of a team that did not win', async () => {
    const { container } = renderWeekly('/leagues/1/2025/weekly?team=3');

    await screen.findByRole('group', { name: 'Team to highlight' });

    const chart = container.querySelector('svg[role="group"]') as SVGSVGElement;
    expect(chart.querySelectorAll('svg[role="img"][aria-label="Champion"]')).toHaveLength(0);
  });

  it('starts on the team named in the address', async () => {
    renderWeekly('/leagues/1/2025/weekly?team=3');

    await screen.findByRole('group', { name: 'Team to highlight' });

    expect(pressed()).toBe('Team 3');
  });

  it('falls back to the default for a team that is not in the league', async () => {
    renderWeekly('/leagues/1/2025/weekly?team=999');

    await screen.findByRole('group', { name: 'Team to highlight' });

    expect(pressed()).toBe('Team 5');
  });

  it('changes the selection and the address without adding a history entry', async () => {
    renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });
    const before = window.history.length;

    await userEvent.click(screen.getByRole('button', { name: 'Team 3' }));

    expect(pressed()).toBe('Team 3');
    expect(window.location.pathname + window.location.search).toBe('/leagues/1/2025/weekly?team=3');
    expect(window.history.length).toBe(before);
  });

  it('shows a long name in full', async () => {
    const long = 'The Extraordinarily Long-Named Gridiron Gladiators of Springfield';
    const base = seasonReport();
    renderWeekly('/leagues/1/2025/weekly', {
      ...base,
      teams: base.teams.map((team) => (team.team_id === 3 ? { ...team, name: long } : team)),
    });

    expect(await screen.findByRole('button', { name: long })).toBeInTheDocument();
  });
});

describe('the weekly lines', () => {
  it('draws a gray line per other team, the median, and the selected team on top', async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    expect(container.querySelectorAll('path.other')).toHaveLength(7);
    expect(container.querySelectorAll('path.chosen')).toHaveLength(1);
    expect(container.querySelectorAll('path.median')).toHaveLength(1);
  });

  it("marks each of the selected team's games as a win or a loss", async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    expect(container.querySelectorAll('circle.result')).toHaveLength(14);
    expect(container.querySelectorAll('circle.result.win')).toHaveLength(13);
    expect(container.querySelectorAll('circle.result.loss')).toHaveLength(1);
  });

  it('names the selected team at the end of its line', async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    expect(container.querySelector('text.label')?.textContent?.trim()).toBe('Team 5');
  });

  it('describes the chart in words', async () => {
    renderWeekly();

    expect(
      await screen.findByRole('group', {
        name: 'Points scored each week by 8 teams over 14 weeks, with Team 5 highlighted',
      }),
    ).toBeInTheDocument();
  });

  it('shows the week when the pointer is near it, and clears when it leaves', async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });
    const svg = container.querySelector('svg[role="group"]') as SVGSVGElement;
    const dot = [...container.querySelectorAll('circle.result')][5] as SVGCircleElement;
    const x = Number(dot.getAttribute('cx'));

    await fireEvent.pointerMove(svg, { clientX: x + 3, clientY: 100 });

    expect(screen.getByText('Week 6')).toBeInTheDocument();
    expect(screen.getByText(/^League median \d/)).toBeInTheDocument();
    expect(screen.getByText(/Won against/)).toBeInTheDocument();

    await fireEvent.pointerLeave(svg, { pointerType: 'mouse' });

    expect(screen.queryByText('Week 6')).not.toBeInTheDocument();
  });

  it('keeps the tooltip after a finger lifts and drops it on a tap elsewhere', async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });
    const svg = container.querySelector('svg[role="group"]') as SVGSVGElement;
    const dot = [...container.querySelectorAll('circle.result')][2] as SVGCircleElement;

    await fireEvent.pointerDown(svg, {
      clientX: Number(dot.getAttribute('cx')),
      clientY: 100,
      pointerType: 'touch',
    });
    await fireEvent.pointerLeave(svg, { pointerType: 'touch' });

    expect(screen.getByText('Week 3')).toBeInTheDocument();

    await fireEvent.pointerDown(document.body, { pointerType: 'touch' });

    expect(screen.queryByText('Week 3')).not.toBeInTheDocument();
  });

  it('labels both axes', async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    const titles = [...container.querySelectorAll('svg text.axis-title')].map((title) =>
      title.textContent?.trim(),
    );

    expect(titles).toEqual(['Week', 'Points']);
  });

  it('shows the selected team week by week as a table', async () => {
    renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    await userEvent.click(screen.getAllByRole('button', { name: 'Table' })[0] as HTMLElement);

    const table = screen.getByRole('table', {
      name: 'Team 5 week by week, with the league median',
    });
    const rows = within(table).getAllByRole('row');
    expect(
      within(rows[0] as HTMLElement)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Week', 'Opponent', 'Score', 'Their score', 'Result', 'League median']);
    expect(rows).toHaveLength(15);
    const week1 = within(rows[1] as HTMLElement);
    expect(week1.getByRole('rowheader')).toHaveTextContent('1');
    expect(week1.getAllByRole('cell')).toHaveLength(5);
    expect(['Won', 'Lost']).toContain(week1.getAllByRole('cell')[3]?.textContent);
  });

  it('keeps the team chips in the table view, and the table follows them', async () => {
    renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Table' })[0] as HTMLElement);

    await userEvent.click(screen.getByRole('button', { name: 'Team 3' }));

    expect(
      screen.getByRole('table', { name: 'Team 3 week by week, with the league median' }),
    ).toBeInTheDocument();
    expect(pressed()).toBe('Team 3');
  });
});

describe('boom or bust', () => {
  it('has a row per team, steadiest first, each described in words', async () => {
    renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    const rows = screen.getAllByRole('img', { name: /typical swing/ });

    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveAccessibleName(/^Team 1 scored/);
  });

  it("draws a dot per week, and colors only the selected team's dots", async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    expect(container.querySelectorAll('.track .dot')).toHaveLength(8 * 14);
    expect(container.querySelectorAll('.track .dot.chosen')).toHaveLength(14);
    expect(container.querySelectorAll('.track .mean')).toHaveLength(8);
  });

  it('prints the swing and the average on every row', async () => {
    renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    expect(screen.getByText('±13.1')).toBeInTheDocument();
    expect(screen.getAllByText(/^avg /)).toHaveLength(8);
  });

  it('follows the chips: picking another team recolors the dots', async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    await userEvent.click(screen.getByRole('button', { name: 'Team 3' }));

    const lit = [...container.querySelectorAll('.track')].filter((track) =>
      track.querySelector('.dot.chosen'),
    );
    expect(lit).toHaveLength(1);
    expect(lit[0]?.getAttribute('aria-label')).toMatch(/^Team 3 scored/);
  });

  it("tints the selected team's row as well as coloring its dots", async () => {
    const { container } = renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    const marked = () =>
      [...container.querySelectorAll('li.row.marked .track')].map(
        (track) => track.getAttribute('aria-label')?.split(' scored')[0],
      );
    expect(marked()).toEqual(['Team 5']);

    await userEvent.click(screen.getByRole('button', { name: 'Team 3' }));

    expect(marked()).toEqual(['Team 3']);
  });

  it('shows the same numbers as a table', async () => {
    renderWeekly();
    await screen.findByRole('group', { name: 'Team to highlight' });

    await userEvent.click(screen.getAllByRole('button', { name: 'Table' })[1] as HTMLElement);

    const table = screen.getByRole('table', {
      name: 'Average, swing, best and worst weekly score for each team, steadiest first',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(9);
  });
});

describe('the weekly tab with nothing to show', () => {
  it('says so before any games are played', async () => {
    renderWeekly('/leagues/1/2025/weekly', { ...seasonReport(), teams: [], weeks: [] });

    expect(await screen.findByText('No games have been played yet.')).toBeInTheDocument();
  });
});
