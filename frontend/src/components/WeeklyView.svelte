<script lang="ts">
  import TeamChips from '@/components/TeamChips.svelte';
  import type { SeasonReport } from '@/lib/api/client';
  import BoomBustRows from '@/lib/charts/BoomBustRows.svelte';
  import ChartFrame from '@/lib/charts/ChartFrame.svelte';
  import ChartTable from '@/lib/charts/ChartTable.svelte';
  import WeeklyLines from '@/lib/charts/WeeklyLines.svelte';
  import { formatPoints } from '@/lib/format';
  import { seasonPath } from '@/lib/router.svelte';
  import { selectedTeamId, weeklyView } from '@/lib/season/weekly';
  import { useServices } from '@/lib/services';

  let {
    season,
    leagueId,
    year,
    requestedTeam,
  }: { season: SeasonReport; leagueId: number; year: number; requestedTeam?: number } = $props();

  const { router } = useServices();

  const view = $derived(weeklyView(season));
  const selectedId = $derived(selectedTeamId(view, requestedTeam));

  function choose(teamId: number): void {
    router.replace(seasonPath(leagueId, year, 'weekly', teamId));
  }
</script>

{#if view.weeks.length === 0 || selectedId === null}
  <p class="empty">No games have been played yet.</p>
{:else}
  <div class="stack">
    <ChartFrame title="How did the season unfold?" index={0}>
      {#snippet chart()}
        <TeamChips teams={view.teams.map((entry) => entry.team)} selected={selectedId} onselect={choose} />
        <WeeklyLines {view} {selectedId} />
      {/snippet}
      {#snippet table()}
        <ChartTable
          caption="Points scored by each team in each week"
          columns={[
            { label: 'Team' },
            ...view.weeks.map((week) => ({ label: `Wk ${week}`, numeric: true })),
          ]}
          rows={view.teams.map((entry) => [
            entry.team.name,
            ...view.weeks.map((week) => {
              const game = entry.games.find((candidate) => candidate.week === week);
              return game ? formatPoints(game.points) : '–';
            }),
          ])}
        />
      {/snippet}
    </ChartFrame>

    <ChartFrame title="Steady or boom-or-bust?" index={1}>
      {#snippet chart()}
        <BoomBustRows {view} {selectedId} />
      {/snippet}
      {#snippet table()}
        <ChartTable
          caption="Average, swing, best and worst weekly score for each team, steadiest first"
          columns={[
            { label: 'Team' },
            { label: 'Average', numeric: true },
            { label: 'Swing', numeric: true },
            { label: 'Best week', numeric: true },
            { label: 'Worst week', numeric: true },
          ]}
          rows={view.strip.map((row) => [
            row.team.name,
            formatPoints(row.mean),
            `±${row.swing.toFixed(1)}`,
            formatPoints(row.best),
            formatPoints(row.worst),
          ])}
        />
      {/snippet}
    </ChartFrame>
  </div>
{/if}

<style>
  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }

  .empty {
    color: var(--muted);
  }
</style>
