<script lang="ts">
  import { untrack } from 'svelte';
  import ErrorPanel from '@/components/ErrorPanel.svelte';
  import type { LeagueAccess, Member } from '@/lib/api/client';
  import { useServices } from '@/lib/services';

  let { league }: { league: LeagueAccess } = $props();

  const { api } = useServices();

  let members = $state<Member[]>(untrack(() => league.members));
  let label = $state('');
  let sub = $state('');
  let failure = $state<unknown>(null);

  async function save(next: Member[]): Promise<boolean> {
    failure = null;
    try {
      await api.setMembers(league.league_id, next);
      members = next;
      return true;
    } catch (error) {
      failure = error;
      return false;
    }
  }

  async function add(): Promise<void> {
    const entry = { sub: sub.trim(), label: label.trim() };
    if (entry.sub !== '' && (await save([...members.filter((m) => m.sub !== entry.sub), entry]))) {
      sub = '';
      label = '';
    }
  }
</script>

<div class="league">
  <h2>{league.name}</h2>
  {#if failure}<ErrorPanel error={failure} />{/if}
  {#if members.length === 0}
    <p class="status">Only admins can see this league.</p>
  {:else}
    <ul>
      {#each members as member (member.sub)}
        <li>
          <span class="label">{member.label || 'Unnamed'}</span>
          <code>{member.sub}</code>
          <button
            type="button"
            onclick={() =>
              save(members.filter((m) => m.sub !== member.sub))}
            aria-label="Remove {member.label || member.sub} from {league.name}"
          >
            Remove
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void add();
    }}
  >
    <input bind:value={label} placeholder="Name" maxlength="60" aria-label="Name for the new member of {league.name}" />
    <input
      bind:value={sub}
      placeholder="Lasso ID"
      aria-label="Lasso ID of the new member of {league.name}"
      required
    />
    <button type="submit">Add</button>
  </form>
</div>

<style>
  .league {
    margin-top: 1.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
  }

  h2 {
    font-size: 1.15rem;
  }

  ul {
    list-style: none;
    margin: 0.75rem 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .label {
    font-weight: 650;
  }

  code {
    color: var(--muted);
    overflow-wrap: anywhere;
    flex: 1;
  }

  form {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }

  input {
    flex: 1 1 10rem;
    min-width: 0;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    font: inherit;
  }

  button {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    cursor: pointer;
  }

  button:hover {
    background: var(--surface-raised);
  }

  .status {
    color: var(--muted);
  }
</style>
