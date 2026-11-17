export interface LabelCandidate {
  id: string;
  text: string;
  x: number;
  y: number;
  /** Room to leave beside the text for an icon. */
  iconWidth?: number;
}

export interface PlacedLabel {
  x: number;
  y: number;
  anchor: 'start' | 'end';
}

export interface LabelOptions {
  /** Every candidate's dot is an obstacle, labelled or not. */
  dotRadius: number;
  fontSize: number;
  gap: number;
  bounds: { left: number; top: number; right: number; bottom: number };
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const CHARACTER_WIDTH = 0.58;

/**
 * Places a label beside each dot, most important first, and leaves out any label that would
 * overlap a dot, an earlier label or the edge of the chart. Candidates must be in priority order.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  options: LabelOptions,
): Map<string, PlacedLabel> {
  const placed = new Map<string, PlacedLabel>();
  const dots = candidates.map((candidate) => dotBox(candidate, options.dotRadius));
  const taken: Box[] = [];

  for (const candidate of candidates) {
    const width =
      candidate.text.length * options.fontSize * CHARACTER_WIDTH + (candidate.iconWidth ?? 0);
    const sides: PlacedLabel['anchor'][] = ['start', 'end'];
    for (const anchor of sides) {
      const x =
        anchor === 'start'
          ? candidate.x + options.dotRadius + options.gap
          : candidate.x - options.dotRadius - options.gap;
      const box: Box = {
        left: anchor === 'start' ? x : x - width,
        right: anchor === 'start' ? x + width : x,
        top: candidate.y - options.fontSize / 2,
        bottom: candidate.y + options.fontSize / 2,
      };
      if (fits(box, options.bounds) && ![...dots, ...taken].some((other) => overlaps(box, other))) {
        taken.push(box);
        placed.set(candidate.id, { x, y: candidate.y, anchor });
        break;
      }
    }
  }
  return placed;
}

function dotBox(candidate: LabelCandidate, radius: number): Box {
  return {
    left: candidate.x - radius,
    right: candidate.x + radius,
    top: candidate.y - radius,
    bottom: candidate.y + radius,
  };
}

function fits(box: Box, bounds: LabelOptions['bounds']): boolean {
  return (
    box.left >= bounds.left &&
    box.right <= bounds.right &&
    box.top >= bounds.top &&
    box.bottom <= bounds.bottom
  );
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
