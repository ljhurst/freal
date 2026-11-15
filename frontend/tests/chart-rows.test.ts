import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Harness from './ChartRowsHarness.svelte';

const ROWS = [
  { id: 1, label: 'Alpha', n: 4 },
  { id: 2, label: 'The Extraordinarily Long-Named Gridiron Gladiators of Springfield', n: 7 },
];

describe('ChartRows', () => {
  it('lists a row per item under the given accessible name', () => {
    render(Harness, { rows: ROWS });

    const list = screen.getByRole('list', { name: 'Things, biggest first' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it("describes each row's track in words and draws the track and value content", () => {
    const { container } = render(Harness, { rows: ROWS });

    expect(screen.getByRole('img', { name: 'Alpha is 4' })).toContainElement(
      container.querySelector('.mark') as HTMLElement,
    );
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('shows a long name in full', () => {
    render(Harness, { rows: ROWS });

    expect(
      screen.getByText('The Extraordinarily Long-Named Gridiron Gladiators of Springfield'),
    ).toBeInTheDocument();
  });

  it('has a header row only when asked, hidden from assistive technology', () => {
    const { container, rerender } = render(Harness, { rows: ROWS });
    expect(container.querySelector('.head')).not.toBeInTheDocument();

    rerender({ rows: ROWS, header: true });

    const head = screen.getByText('Header title').closest('li') as HTMLElement;
    expect(head).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('marks tracks for a guide line only when asked', () => {
    const { container, rerender } = render(Harness, { rows: ROWS });
    expect(container.querySelector('.track.guide')).not.toBeInTheDocument();

    rerender({ rows: ROWS, guide: true });

    expect(container.querySelectorAll('.track.guide')).toHaveLength(2);
  });

  it('tints only the rows it is asked to mark', () => {
    const { container, rerender } = render(Harness, { rows: ROWS });
    expect(container.querySelector('.row.marked')).not.toBeInTheDocument();
    expect(container.querySelector('.has-marks')).not.toBeInTheDocument();

    rerender({ rows: ROWS, tint: true });

    const marked = container.querySelectorAll('.row.marked');
    expect(marked).toHaveLength(1);
    expect(within(marked[0] as HTMLElement).getByText('Alpha')).toBeInTheDocument();
    expect(container.querySelector('.has-marks')).toBeInTheDocument();
  });

  it('sets the row height for every cell from one value', () => {
    const { container } = render(Harness, { rows: ROWS });

    expect(
      (container.querySelector('.scroll') as HTMLElement).style.getPropertyValue('--row-height'),
    ).toBe('3rem');
  });
});
