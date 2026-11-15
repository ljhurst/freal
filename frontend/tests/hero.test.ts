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
      teams: base.teams.map((team) => ({ ...team, for_real: false })),
    };

    render(Hero, {
      context: contextFor(services()),
      props: { highlights: highlights(none), leagueId: 1, year: 2025 },
    });

    expect(screen.getByRole('heading', { name: "Who's for real?" })).toBeInTheDocument();
    expect(screen.getByText('Nobody yet')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
