<script lang="ts">
  import { link } from '@/lib/link';
  import type { Router } from '@/lib/router.svelte';

  interface TabItem {
    id: string;
    label: string;
    href: string;
  }

  let {
    items,
    active,
    router,
    label,
  }: { items: readonly TabItem[]; active: string; router: Router; label: string } = $props();
</script>

<nav aria-label={label}>
  <ul>
    {#each items as item (item.id)}
      <li>
        <a
          href={item.href}
          use:link={router}
          class:active={item.id === active}
          aria-current={item.id === active ? 'page' : undefined}
        >
          {item.label}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  nav {
    overflow-x: auto;
    scrollbar-width: none;
  }

  ul {
    display: flex;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    position: relative;
    display: block;
    padding: 0.6rem 0.9rem;
    color: var(--muted);
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    transition: color var(--dur-fast) var(--ease-out);
  }

  a:hover,
  a.active {
    color: var(--text);
  }

  a::after {
    content: '';
    position: absolute;
    left: 0.9rem;
    right: 0.9rem;
    bottom: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: var(--accent);
    transform: scaleX(0);
    transition: transform var(--dur) var(--ease-out);
  }

  a.active::after {
    transform: scaleX(1);
  }
</style>
