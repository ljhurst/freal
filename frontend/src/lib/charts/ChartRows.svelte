<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';

  let {
    label,
    rows,
    key,
    name,
    describe,
    track,
    value,
    headName,
    headTrack,
    rowHeight = '2.2rem',
    guide = false,
  }: {
    label: string;
    rows: readonly T[];
    key: (row: T) => string | number;
    name: (row: T) => string;
    /** The spoken description of a row's track. */
    describe: (row: T) => string;
    track: Snippet<[T]>;
    value: Snippet<[T]>;
    headName?: Snippet;
    headTrack?: Snippet;
    rowHeight?: string;
    /** Draws a faint line under a row's marks when the layout stacks, so they read on a shared axis. */
    guide?: boolean;
  } = $props();
</script>

<div class="scroll" style:--row-height={rowHeight}>
  <ol class="rows" aria-label={label}>
    {#if headName || headTrack}
      <li class="head" aria-hidden="true">
        <span class="head-name">{@render headName?.()}</span>
        <span class="head-track">{@render headTrack?.()}</span>
        <span></span>
      </li>
    {/if}
    {#each rows as row, index (key(row))}
      <li class="row" style:--i={index}>
        <span class="name">{name(row)}</span>
        <span class="track" class:guide role="img" aria-label={describe(row)}>
          {@render track(row)}
        </span>
        <span class="value" aria-hidden="true">{@render value(row)}</span>
      </li>
    {/each}
  </ol>
</div>

<style>
  .scroll {
    overflow-x: auto;
  }

  .rows {
    display: grid;
    grid-template-columns: max-content minmax(9rem, 1fr) max-content;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
    min-width: 22rem;
  }

  .row,
  .head {
    display: contents;
  }

  .name,
  .track,
  .value {
    display: flex;
    align-items: center;
    height: var(--row-height);
    border-bottom: 1px solid var(--border);
  }

  .row:last-child > * {
    border-bottom: 0;
  }

  .name {
    padding-right: 1rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .track {
    position: relative;
  }

  .value {
    justify-content: flex-end;
    padding-left: 1rem;
    white-space: nowrap;
  }

  .head-name {
    align-self: end;
    padding: 0 1rem 0.2rem 0;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  @media (max-width: 52rem) {
    .rows {
      display: block;
      min-width: 0;
    }

    .head {
      display: block;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'name value'
        'track track';
      column-gap: 0.75rem;
      align-items: baseline;
      padding: 0.6rem 0 0.2rem;
      border-bottom: 1px solid var(--border);
    }

    .row:last-child {
      border-bottom: 0;
    }

    .name,
    .value,
    .track {
      height: auto;
      padding: 0;
      border-bottom: 0;
    }

    .name {
      grid-area: name;
      white-space: normal;
    }

    .value {
      grid-area: value;
    }

    .track {
      grid-area: track;
      height: 1.75rem;
    }

    .guide::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      border-top: 1px solid var(--grid);
    }
  }
</style>
