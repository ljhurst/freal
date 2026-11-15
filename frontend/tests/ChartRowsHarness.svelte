<script lang="ts">
  import ChartRows from '@/lib/charts/ChartRows.svelte';

  interface Item {
    id: number;
    label: string;
    n: number;
  }

  let {
    rows,
    header = false,
    guide = false,
  }: { rows: Item[]; header?: boolean; guide?: boolean } = $props();
</script>

{#snippet head()}Header title{/snippet}
{#snippet mark(row: Item)}<i class="mark">{row.n}</i>{/snippet}
{#snippet shown(row: Item)}{row.n * 2}{/snippet}

<ChartRows
  label="Things, biggest first"
  {rows}
  key={(row) => row.id}
  name={(row) => row.label}
  describe={(row) => `${row.label} is ${row.n}`}
  track={mark}
  value={shown}
  headName={header ? head : undefined}
  {guide}
  rowHeight="3rem"
/>
