<script lang="ts">
  import { TROPHY_PATHS } from '@/lib/ui/trophy';
</script>

<svg
  class="trophy"
  viewBox="0 0 24 24"
  width="1em"
  height="1em"
  role="img"
  aria-label="Champion"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#each TROPHY_PATHS as path (path.d)}
    <path d={path.d} fill={path.filled ? 'currentColor' : 'none'} fill-opacity={path.filled ? 0.25 : 1} />
  {/each}
</svg>

<style>
  .trophy {
    color: var(--trophy);
    vertical-align: -0.12em;
    margin-left: 0.35rem;
  }
</style>
