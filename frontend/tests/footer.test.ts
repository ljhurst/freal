import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import App from '@/App.svelte';
import { contextFor, fakeApi, league, services } from './helpers';

const version = /^version = "(.+)"$/m.exec(readFileSync('../pyproject.toml', 'utf8'))?.[1];

describe('the footer', () => {
  it('shows the app version on a page with data', async () => {
    const appServices = services({
      api: fakeApi({ leagues: async () => [league()] }),
    });
    render(App, { context: contextFor(appServices) });

    await screen.findByText('Family League');

    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`freal v${version}`);
  });
});
