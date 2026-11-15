import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LuckBar from '@/lib/charts/LuckBar.svelte';
import Meter from '@/lib/charts/Meter.svelte';
import Sparkline from '@/lib/charts/Sparkline.svelte';

describe('LuckBar', () => {
  it('grows to the right for luck and to the left for bad luck, scaled to the league', () => {
    const { container, unmount } = render(LuckBar, { luck: 1, limit: 2 });
    expect(container.querySelector('.bar.lucky')).toHaveStyle({ width: '25%' });
    expect(screen.getByRole('img')).toHaveAccessibleName('1.0 wins luckier than scoring earned');
    unmount();

    const unlucky = render(LuckBar, { luck: -2, limit: 2 });
    expect(unlucky.container.querySelector('.bar.unlucky')).toHaveStyle({ width: '50%' });
    expect(screen.getByRole('img')).toHaveAccessibleName('2.0 wins unluckier than scoring earned');
  });

  it('draws nothing but the track for a record that matches the scoring', () => {
    const { container } = render(LuckBar, { luck: 0, limit: 2 });

    expect(container.querySelector('.bar.even')).toHaveStyle({ width: '0%' });
    expect(screen.getByRole('img')).toHaveAccessibleName('Record matches what scoring earned');
  });

  it('never grows past its half of the track', () => {
    const { container } = render(LuckBar, { luck: 5, limit: 2 });

    expect(container.querySelector('.bar')).toHaveStyle({ width: '50%' });
  });
});

describe('Meter', () => {
  it('fills to the value and says it in words', () => {
    const { container } = render(Meter, { value: 0.871, label: 'Lineup efficiency' });

    expect(container.querySelector('.fill')).toHaveStyle({ width: '87.1%' });
    expect(screen.getByRole('img')).toHaveAccessibleName('Lineup efficiency: 87.1%');
  });
});

describe('Sparkline', () => {
  it('has one point per game and describes the latest score', () => {
    const { container } = render(Sparkline, { points: [100, 120, 90], min: 80, max: 130 });

    expect(container.querySelector('polyline')?.getAttribute('points')?.split(' ')).toHaveLength(3);
    expect(screen.getByRole('img')).toHaveAccessibleName('Weekly points over 3 games, latest 90.0');
  });

  it('draws nothing before any game is played', () => {
    render(Sparkline, { points: [], min: 0, max: 0 });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
