<script lang="ts">
  export interface Column {
    label: string;
    /** Numbers line up on their right edge. */
    numeric?: boolean;
  }

  let {
    caption,
    columns,
    rows,
  }: { caption: string; columns: readonly Column[]; rows: readonly (readonly string[])[] } =
    $props();
</script>

<div class="scroll">
  <table>
    <caption class="visually-hidden">{caption}</caption>
    <thead>
      <tr>
        {#each columns as column (column.label)}
          <th scope="col" class:numeric={column.numeric}>{column.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, index (index)}
        <tr>
          {#each row as cell, position (position)}
            {#if position === 0}
              <th scope="row">{cell}</th>
            {:else}
              <td class:numeric={columns[position]?.numeric}>{cell}</td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.6rem 0.8rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  th[scope='row'] {
    font-weight: 650;
  }

  thead th {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .numeric {
    text-align: right;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
