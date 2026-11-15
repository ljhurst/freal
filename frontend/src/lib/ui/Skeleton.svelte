<script lang="ts">
  let { width = '100%', height = '1rem' }: { width?: string; height?: string } = $props();
</script>

<span class="skeleton" style:width style:height aria-hidden="true"></span>

<style>
  .skeleton {
    display: block;
    border-radius: var(--radius-sm);
    background: linear-gradient(90deg, var(--surface-raised), var(--border), var(--surface-raised));
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }

  @keyframes shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
</style>
