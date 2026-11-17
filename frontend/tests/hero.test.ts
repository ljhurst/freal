import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Hero from '@/components/Hero.svelte';
import type { TeamReport } from '@/lib/api/client';
import { highlights } from '@/lib/season/highlights';
import { contextFor, seasonReport, services } from './helpers';

function renderHero(stamp: (team: TeamReport) => TeamReport['stamp']) {
  const base = seasonReport();
  const season = { ...base, teams: base.teams.map((team) => ({ ...team, stamp: stamp(team) })) };
  render(Hero, {
    context: contextFor(services()),
    props: { highlights: highlights(season), leagueId: 1, year: 2025 },
  });
}

describe('Hero', () => {
  it('is a card titled for the question, with nobody yet when no team is for real', () => {
    renderHero(() => null);

    expect(screen.getByRole('heading', { name: "Who's for real?" })).toBeInTheDocument();
    expect(screen.getByText('Nobody yet')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'For real' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: "Who's in the hunt?" })).not.toBeInTheDocument();
  });

  it('lists the teams that are for real, in standing order', () => {
    renderHero((team) => (['Team 5', 'Team 6'].includes(team.name) ? 'for_real' : null));

    const list = screen.getByRole('list', { name: 'For real' });

    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.trim()),
    ).toEqual(['✓ Team 5', '✓ Team 6']);
  });

  it('gives the teams in the hunt their own labelled section, as links', () => {
    renderHero((team) => {
      if (['Team 5', 'Team 6'].includes(team.name)) return 'for_real';
      return ['Team 4', 'Team 2'].includes(team.name) ? 'in_the_hunt' : null;
    });

    expect(screen.getByRole('heading', { name: "Who's in the hunt?" })).toBeInTheDocument();
    const pills = screen.getByRole('list', { name: 'In the hunt' });
    const links = within(pills).getAllByRole('link');

    expect(links.map((link) => link.textContent?.trim())).toEqual(['Team 4', 'Team 2']);
    expect(links[0]).toHaveAttribute('href', '/leagues/1/2025/weekly?team=4');
    expect(
      within(screen.getByRole('list', { name: 'For real' })).getAllByRole('listitem'),
    ).toHaveLength(2);
  });

  it('still shows the teams in the hunt when nobody is for real yet', () => {
    renderHero((team) => (team.name === 'Team 4' ? 'in_the_hunt' : null));

    expect(screen.getByText('Nobody yet')).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'In the hunt' })).getByRole('link'),
    ).toHaveTextContent('Team 4');
  });
});
