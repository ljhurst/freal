<script lang="ts">
  import { describeError } from '@/lib/errors';

  let { error }: { error: unknown } = $props();
  const message = $derived(describeError(error));
</script>

<div class="panel" role="alert">
  <h2>{message.title}</h2>
  <p>{message.detail}</p>
</div>

<style>
  .panel {
    border: 1px solid var(--border);
    border-left: 4px solid var(--warn);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 1rem 1.25rem;
  }

  h2 {
    font-size: 1.1rem;
  }

  p {
    margin: 0;
    color: var(--muted);
  }
</style>
