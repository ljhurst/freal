import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Hero from '@/components/Hero.svelte';
import { highlights } from '@/lib/season/highlights';
import { contextFor, seasonReport, services } from './helpers';

describe('Hero', () => {
  it('says nobody yet when no team has earned the stamp', () => {
    const base = seasonReport();
    const none = {
      ...base,
      teams: base.teams.map((team) => ({ ...team, stamp: null })),
    };

    render(Hero, {
      context: contextFor(services()),
      props: { highlights: highlights(none), leagueId: 1, year: 2025 },
    });

    expect(screen.getByRole('heading', { name: "Who's for real?" })).toBeInTheDocument();
    expect(screen.getByText('Nobody yet')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.queryByText(/In the hunt:/)).not.toBeInTheDocument();
  });

  it('names the teams in the hunt beneath the ones that are for real', () => {
    const base = seasonReport();
    const season = {
      ...base,
      teams: base.teams.map((team) =>
        team.name === 'Team 4' || team.name === 'Team 2'
          ? { ...team, stamp: 'in_the_hunt' as const }
          : team,
      ),
    };

    render(Hero, {
      context: contextFor(services()),
      props: { highlights: highlights(season), leagueId: 1, year: 2025 },
    });

    const line = screen.getByText(/In the hunt:/);
    expect(line).toHaveTextContent('In the hunt: Team 4, Team 2');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent?.trim())).toEqual([
      '✓ Team 5',
      '✓ Team 6',
    ]);
  });
});
