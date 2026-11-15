import { render, screen } from '@testing-library/svelte';
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

function renderAt(path: string) {
  const appServices = services({
    path,
    api: fakeApi({
      leagues: async () => [league({ league_id: 1, years: [2025] })],
      season: async () => seasonReport(),
    }),
  });
  render(App, { context: contextFor(appServices) });
}

const CARDS: readonly { path: string; title: string; phrase: RegExp }[] = [
  {
    path: '/leagues/1/2025',
    title: "Who's for real?",
    phrase: /for real when its scoring is good/,
  },
  {
    path: '/leagues/1/2025',
    title: 'Standings',
    phrase: /Luck is actual wins minus expected wins/,
  },
  { path: '/leagues/1/2025/luck', title: 'Who got the breaks?', phrase: /dashed line/ },
  {
    path: '/leagues/1/2025/luck',
    title: 'Did the schedule help?',
    phrase: /opponents scored per game/,
  },
  { path: '/leagues/1/2025/lineups', title: 'Who sets the best lineup?', phrase: /hatched part/ },
  { path: '/leagues/1/2025/weekly', title: 'How did the season unfold?', phrase: /league median/ },
  { path: '/leagues/1/2025/weekly', title: 'Steady or boom-or-bust?', phrase: /Swing is how far/ },
];

describe.each(CARDS)('the help on "$title"', ({ path, title, phrase }) => {
  const name = `How to read this: ${title}`;

  it('starts closed', async () => {
    renderAt(path);

    const button = await screen.findByRole('button', { name });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(phrase)).not.toBeVisible();
  });

  it('opens with a click and closes again', async () => {
    renderAt(path);
    const button = await screen.findByRole('button', { name });

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(phrase)).toBeVisible();

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(phrase)).not.toBeVisible();
  });

  it('works from the keyboard and names the text it controls', async () => {
    renderAt(path);
    const button = await screen.findByRole('button', { name });

    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(button).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(button.getAttribute('aria-controls') as string);
    expect(panel).toHaveAttribute('role', 'note');
    expect(panel).toContainElement(screen.getByText(phrase));
  });
});

describe('several explainers on one page', () => {
  it('open on their own, not together', async () => {
    renderAt('/leagues/1/2025/luck');
    const breaks = await screen.findByRole('button', {
      name: 'How to read this: Who got the breaks?',
    });
    const schedule = screen.getByRole('button', {
      name: 'How to read this: Did the schedule help?',
    });

    await userEvent.click(breaks);

    expect(breaks).toHaveAttribute('aria-expanded', 'true');
    expect(schedule).toHaveAttribute('aria-expanded', 'false');
  });

  it('use different ids, so each button controls its own text', async () => {
    renderAt('/leagues/1/2025/luck');
    await screen.findByRole('button', { name: 'How to read this: Who got the breaks?' });

    const controls = screen
      .getAllByRole('button', { name: /^How to read this/ })
      .map((button) => button.getAttribute('aria-controls'));

    expect(new Set(controls).size).toBe(controls.length);
    for (const id of controls) {
      expect(document.getElementById(id as string)).toBeInTheDocument();
    }
  });
});
