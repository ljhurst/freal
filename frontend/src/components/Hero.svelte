<script lang="ts">
  import { teamPath } from '@/lib/router.svelte';
  import type { Highlights } from '@/lib/season/highlights';
  import HelpButton from '@/lib/ui/HelpButton.svelte';
  import HelpPanel from '@/lib/ui/HelpPanel.svelte';
  import PlainLink from '@/lib/ui/PlainLink.svelte';

  let { highlights, leagueId, year }: { highlights: Highlights; leagueId: number; year: number } =
    $props();

  const helpId = $props.id();
  let helpOpen = $state(false);
</script>

<section class="hero rise">
  <div class="heading">
    <h2 class="eyebrow">Who's for real?</h2>
    <HelpButton label="How to read this: Who's for real?" controls={helpId} bind:open={helpOpen} />
  </div>
  <HelpPanel id={helpId} open={helpOpen}>
    <p>
      Teams that are For Real are threats to win the league. Their strength is measured by how many
      points they score above the league average, accounting for early season uncertainty. They are
      likely to finish in the top quarter of the league.
    </p>
    <p>In the hunt means a real shot, but the scoring can't confirm it yet.</p>
  </HelpPanel>
  {#if highlights.forReal.length > 0}
    <ul>
      {#each highlights.forReal as team (team.team_id)}
        <li>
          <span class="badge" aria-hidden="true">✓</span>
          <PlainLink href={teamPath(leagueId, year, team.team_id)}>{team.name}</PlainLink>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="nobody">Nobody yet</p>
  {/if}
  {#if highlights.inTheHunt.length > 0}
    <p class="hunt">
      <span class="glyph" aria-hidden="true">◐</span>
      In the hunt:
      {#each highlights.inTheHunt as team, index (team.team_id)}
        <PlainLink href={teamPath(leagueId, year, team.team_id)}>{team.name}</PlainLink>{index <
        highlights.inTheHunt.length - 1
          ? ', '
          : ''}
      {/each}
    </p>
  {/if}
</section>

<style>
  .hero {
    padding: 0.25rem 0 1.25rem;
  }

  .heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.5;
    letter-spacing: 0.12em;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
  }

  li {
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

  .hunt {
    margin: 0.75rem 0 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .glyph {
    margin-right: 0.35rem;
    color: var(--accent);
  }

  .nobody {
    margin: 0;
    color: var(--muted);
    font-size: 1.1rem;
  }
</style>
