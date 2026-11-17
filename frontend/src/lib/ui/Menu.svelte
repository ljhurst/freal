<script lang="ts">
  import { link } from '@/lib/link';
  import { useServices } from '@/lib/services';
  import type { MenuItem } from '@/lib/ui/menu';

  let {
    label,
    items,
    size = 'title',
    disabled = false,
    name,
  }: {
    /** The current choice, shown on the button. */
    label: string;
    items: readonly MenuItem[];
    size?: 'title' | 'year';
    disabled?: boolean;
    /** Said before the label by screen readers, so a bare year reads "Season 2025". */
    name?: string;
  } = $props();

  const { router } = useServices();
  const listId = $props.id();

  let open = $state(false);
  let root = $state<HTMLDivElement>();
  let button = $state<HTMLButtonElement>();

  $effect(() => {
    if (disabled) open = false;
  });

  function closeOnOutsideClick(event: MouseEvent): void {
    if (open && root && !root.contains(event.target as Node)) {
      open = false;
    }
  }

  function closeWhenFocusLeaves(event: FocusEvent): void {
    if (open && !root?.contains(event.relatedTarget as Node | null)) {
      open = false;
    }
  }

  function closeOnEscape(event: KeyboardEvent): void {
    if (open && event.key === 'Escape') {
      open = false;
      button?.focus();
    }
  }
</script>

<svelte:window onclick={closeOnOutsideClick} onkeydown={closeOnEscape} />

{#if items.length < 2}
  <span class="menu {size}">
    {#if name}<span class="visually-hidden">{name} </span>{/if}{label}
  </span>
{:else}
  <div class="menu {size}" bind:this={root} onfocusout={closeWhenFocusLeaves}>
    <button
      type="button"
      bind:this={button}
      {disabled}
      aria-expanded={open}
      aria-controls={listId}
      onclick={() => (open = !open)}
    >
      {#if name}<span class="visually-hidden">{name} </span>{/if}
      <span class="name">{label}</span>
      <svg viewBox="0 0 12 12" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 4l4 4 4-4" />
      </svg>
    </button>
    {#if open}
      <ul id={listId}>
        {#each items as item (item.href)}
          <li>
            <a
              href={item.href}
              use:link={router}
              aria-current={item.current ? 'true' : undefined}
              onclick={() => (open = false)}
            >
              <span class="label">{item.label}</span>
              {#if item.current}<span class="check" aria-hidden="true">✓</span>{/if}
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .menu {
    position: relative;
    display: inline-block;
    max-width: 100%;
    line-height: 1.15;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    line-height: inherit;
    text-align: left;
    cursor: pointer;
  }

  .title {
    font-size: clamp(1.9rem, 6vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.02em;
  }

.year {
    color: var(--text);
    font-size: clamp(1.3rem, 4vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  @media (pointer: coarse), (max-width: 36rem) {
    button {
      min-height: 2.75rem;
    }
  }

  button:disabled {
    cursor: progress;
    opacity: 0.6;
  }

  .name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  svg {
    flex: none;
    width: 0.55em;
    height: 0.55em;
    color: var(--muted);
    transition:
      color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }

  button:hover:not(:disabled) svg {
    color: var(--accent);
  }

  button[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }

  ul {
    position: absolute;
    top: 100%;
    /* A caller picks the edge the list hangs from by setting --menu-left and --menu-right. */
    left: var(--menu-left, 0);
    right: var(--menu-right, auto);
    z-index: 5;
    min-width: 100%;
    width: max-content;
    max-width: min(24rem, calc(100vw - 2 * var(--gutter)));
    margin: 0.5rem 0 0;
    padding: 0.35rem;
    list-style: none;
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }

  a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0.7rem;
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    background: var(--surface);
  }

  a[aria-current] {
    color: var(--accent);
  }

  .label {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .check {
    flex: none;
  }
</style>
