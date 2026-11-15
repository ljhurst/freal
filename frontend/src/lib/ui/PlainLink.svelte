<script lang="ts">
  import type { Snippet } from 'svelte';
  import { link } from '@/lib/link';
  import { useServices } from '@/lib/services';

  let { href, children }: { href: string; children: Snippet } = $props();

  const { router } = useServices();
</script>

<a {href} use:link={router}>{@render children()}</a>

<style>
  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.22em;
  }
</style>
