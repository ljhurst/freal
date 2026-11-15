import type { Router } from '@/lib/router.svelte';

/** Turns a plain `<a href>` into a client-side navigation, leaving modified clicks alone. */
export function link(node: HTMLAnchorElement, router: Router) {
  function onClick(event: MouseEvent): void {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    const href = node.getAttribute('href');
    if (event.button !== 0 || modified || node.target || href === null) {
      return;
    }
    event.preventDefault();
    router.navigate(href);
  }

  node.addEventListener('click', onClick);
  return {
    destroy(): void {
      node.removeEventListener('click', onClick);
    },
  };
}
