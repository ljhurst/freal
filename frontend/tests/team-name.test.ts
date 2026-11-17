import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { TeamReport } from '@/lib/api/client';
import TeamName from '@/lib/ui/TeamName.svelte';
import { seasonReport } from './helpers';

const team = seasonReport().teams[0] as TeamReport;

describe('TeamName', () => {
  it('puts a trophy beside the champion', () => {
    render(TeamName, { team: { ...team, name: 'Team 6', final_rank: 1 } });

    expect(screen.getByText('Team 6')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Champion' })).toBeInTheDocument();
  });

  it('shows only the name for any other team', () => {
    render(TeamName, { team: { ...team, name: 'Team 5', final_rank: 2 } });

    expect(screen.getByText('Team 5')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Champion' })).not.toBeInTheDocument();
  });
});
