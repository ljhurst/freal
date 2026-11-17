<script lang="ts">
  import type { TeamReport } from '@/lib/api/client';
  import { isChampion } from '@/lib/season/champion';
  import Trophy from '@/lib/ui/Trophy.svelte';

  let { team }: { team: TeamReport } = $props();
</script>

{team.name}{#if isChampion(team)}<Trophy />{/if}
