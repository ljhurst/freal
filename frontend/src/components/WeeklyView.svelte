<script lang="ts">
  import TeamChips from '@/components/TeamChips.svelte';
  import type { SeasonReport } from '@/lib/api/client';
  import BoomBustRows from '@/lib/charts/BoomBustRows.svelte';
  import ChartFrame from '@/lib/charts/ChartFrame.svelte';
  import ChartTable from '@/lib/charts/ChartTable.svelte';
  import WeeklyLines from '@/lib/charts/WeeklyLines.svelte';
  import { formatPoints } from '@/lib/format';
  import { seasonPath } from '@/lib/router.svelte';
  import { teamLabel } from '@/lib/season/champion';
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
  const selected = $derived(view.teams.find((entry) => entry.team.team_id === selectedId));

  const RESULT_WORDS = { win: 'Won', loss: 'Lost', tie: 'Tied' } as const;

  function choose(teamId: number): void {
    router.replace(seasonPath(leagueId, year, 'weekly', teamId));
  }
</script>

{#if view.weeks.length === 0 || selectedId === null}
  <p class="empty">No games have been played yet.</p>
{:else}
  <div class="stack">
    <ChartFrame title="How did the season unfold?" index={0}>
      {#snippet help()}
        <p>
          Each line is one team's points by week. Pick a team to highlight it. Filled dots are wins,
          hollow dots are losses, and the dashed line is the league median for that week.
        </p>
      {/snippet}
      {#snippet controls()}
        <TeamChips
          teams={view.teams.map((entry) => entry.team)}
          selected={selectedId}
          onselect={choose}
        />
      {/snippet}
      {#snippet chart()}
        <WeeklyLines {view} {selectedId} />
      {/snippet}
      {#snippet table()}
        <ChartTable
          caption="{selected?.team.name ?? 'Team'} week by week, with the league median"
          columns={[
            { label: 'Week' },
            { label: 'Opponent' },
            { label: 'Score', numeric: true },
            { label: 'Their score', numeric: true },
            { label: 'Result' },
            { label: 'League median', numeric: true },
          ]}
          rows={(selected?.games ?? []).map((game) => [
            String(game.week),
            game.opponent?.name ?? '–',
            formatPoints(game.points),
            formatPoints(game.opponentPoints),
            RESULT_WORDS[game.result],
            formatPoints(view.medians.get(game.week) ?? 0),
          ])}
        />
      {/snippet}
    </ChartFrame>

    <ChartFrame title="Steady or boom-or-bust?" index={1}>
      {#snippet help()}
        <p>
          Each dot is one week for that team, and the tick is its average. Swing is how far a typical
          week sits from the team's own average, in points, so high scorers have more room to move:
          read it next to the average.
        </p>
      {/snippet}
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
            teamLabel(row.team),
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
