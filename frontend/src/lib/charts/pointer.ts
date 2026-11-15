export interface PointerReach {
  move: (event: PointerEvent) => void;
  leave: (event: PointerEvent) => void;
  dismiss: (event: PointerEvent) => void;
}

interface ReachOptions {
  target: () => Element | undefined;
  /** The index of whatever is at (x, y), measured from the target's top left. */
  find: (x: number, y: number) => number | null;
  set: (index: number | null) => void;
}

/**
 * Hover and tap handling for a chart. A mouse leaving clears the pick; a finger lifting does not,
 * so a tap keeps its tooltip until the next tap lands somewhere else.
 */
export function pointerReach({ target, find, set }: ReachOptions): PointerReach {
  return {
    move(event) {
      const element = target();
      if (!element) return;
      const box = element.getBoundingClientRect();
      set(find(event.clientX - box.left, event.clientY - box.top));
    },
    leave(event) {
      if (event.pointerType !== 'touch') set(null);
    },
    dismiss(event) {
      if (!target()?.contains(event.target as Node)) set(null);
    },
  };
}
