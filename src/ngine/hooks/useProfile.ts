import { useMemo } from 'react';
import { useObservableState } from 'observable-hooks';
import { kinds } from 'nostr-tools';
import { map } from 'rxjs/operators';
import { eventStore } from '../../nostr/core';

export interface ProfileContent {
  name?: string;
  display_name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud06?: string;
  lud16?: string;
  website?: string;
  [key: string]: unknown;
}

export default function useProfile(pubkey: string): ProfileContent | undefined {
  const profile$ = useMemo(
    () =>
      eventStore.replaceable(kinds.Metadata, pubkey).pipe(
        map(event => {
          if (!event) return undefined;
          try {
            return JSON.parse(event.content) as ProfileContent;
          } catch {
            return undefined;
          }
        })
      ),
    [pubkey]
  );

  return useObservableState(profile$, undefined);
}
