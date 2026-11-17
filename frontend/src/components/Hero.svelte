<script lang="ts">
  import { teamPath } from '@/lib/router.svelte';
  import type { Highlights } from '@/lib/season/highlights';
  import Card from '@/lib/ui/Card.svelte';
  import PlainLink from '@/lib/ui/PlainLink.svelte';
  import TeamName from '@/lib/ui/TeamName.svelte';

  let { highlights, leagueId, year }: { highlights: Highlights; leagueId: number; year: number } =
    $props();
</script>

<div class="hero">
  <Card title="Who's for real?">
    {#snippet help()}
      <p>
        Teams that are For Real are threats to win the league. Their strength is measured by how
        many points they score above the league average, accounting for early season uncertainty.
        They are likely to finish in the top quarter of the league.
      </p>
      <p>In the hunt means a real shot, but the scoring can't confirm it yet.</p>
    {/snippet}
    {#if highlights.forReal.length > 0}
      <ul class="real" aria-label="For real">
        {#each highlights.forReal as team (team.team_id)}
          <li>
            <span class="badge" aria-hidden="true">✓</span>
            <PlainLink href={teamPath(leagueId, year, team.team_id)}><TeamName {team} /></PlainLink>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="nobody">Nobody yet</p>
    {/if}
    {#if highlights.inTheHunt.length > 0}
      <div class="hunt">
        <h3>Who's in the hunt?</h3>
        <ul class="close" aria-label="In the hunt">
          {#each highlights.inTheHunt as team (team.team_id)}
            <li>
              <span class="badge" aria-hidden="true">◐</span>
              <PlainLink href={teamPath(leagueId, year, team.team_id)}><TeamName {team} /></PlainLink>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </Card>
</div>

<style>
  .hero {
    margin-bottom: 1.25rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .real {
    display: grid;
    gap: 0.45rem;
  }

  .real li {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: clamp(1.25rem, 4.5vw, 1.6rem);
    font-weight: 750;
    letter-spacing: -0.02em;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .badge {
    flex: none;
    color: var(--accent);
  }

  .nobody {
    margin: 0;
    color: var(--muted);
    font-size: 1.1rem;
  }

  .hunt {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  h3 {
    margin: 0 0 0.5rem;
    color: var(--muted);
    font-size: 1rem;
    font-weight: 650;
  }

  .close li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.15rem;
    font-weight: 650;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .close :global(a) {
    display: inline-flex;
    align-items: center;
    min-height: 2.5rem;
  }
</style>
