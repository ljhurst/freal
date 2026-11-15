import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { describeError } from '@/lib/errors';

describe('describeError', () => {
  it.each([
    ['espn_auth_expired', 'ESPN needs a refresh'],
    ['espn_unavailable', "ESPN isn't answering"],
    ['invalid_token', "Couldn't sign you in"],
    ['insufficient_scope', 'No access yet'],
    ['league_not_found', 'Not found'],
    ['season_not_found', 'Not found'],
    ['not_configured', 'No leagues set up'],
    ['network_error', "Can't reach freal"],
    ['something_new', 'Something went wrong'],
  ])('explains %s', (code, title) => {
    expect(describeError(new ApiError(502, code)).title).toBe(title);
  });

  it('handles errors that did not come from the API', () => {
    expect(describeError(new Error('boom')).title).toBe('Something went wrong');
  });
});
