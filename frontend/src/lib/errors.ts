import { ApiError } from '@/lib/api/client';
import { BRAND_NAME } from '@/lib/brand';

export interface ErrorMessage {
  title: string;
  detail: string;
}

export function describeError(error: unknown): ErrorMessage {
  if (!(error instanceof ApiError)) {
    return { title: 'Something went wrong', detail: 'Try reloading the page.' };
  }
  switch (error.code) {
    case 'espn_auth_expired':
      return {
        title: 'ESPN needs a refresh',
        detail:
          'The saved ESPN login has expired. Someone with connect access needs to refresh it.',
      };
    case 'espn_unavailable':
      return { title: "ESPN isn't answering", detail: 'Try again in a minute.' };
    case 'invalid_token':
      return {
        title: "Couldn't sign you in",
        detail: 'Your login was rejected. Sign out and back in, or try again in a minute.',
      };
    case 'insufficient_scope':
      return {
        title: 'No access yet',
        detail: `Ask whoever runs ${BRAND_NAME} to give your account access.`,
      };
    case 'league_not_found':
    case 'season_not_found':
      return { title: 'Not found', detail: "That league or season isn't set up." };
    case 'not_configured':
      return { title: 'No leagues set up', detail: `Nothing has been added to ${BRAND_NAME} yet.` };
    case 'network_error':
      return { title: `Can't reach ${BRAND_NAME}`, detail: 'Check your connection and try again.' };
    default:
      return { title: 'Something went wrong', detail: 'Try reloading the page.' };
  }
}
