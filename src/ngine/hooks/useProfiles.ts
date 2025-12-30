import { useMemo } from 'react';
import { useObservableState } from 'observable-hooks';
import { kinds } from 'nostr-tools';
import { combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { eventStore } from '../../nostr/core';
import { ProfileContent } from './useProfile';

export default function useProfiles(pubkeys: string[]): ProfileContent[] {
  const profiles$ = useMemo(() => {
    if (pubkeys.length === 0) {
      return of([]);
    }

    const profileObservables = pubkeys.map(pubkey =>
      eventStore.replaceable(kinds.Metadata, pubkey).pipe(
        map(event => {
          if (!event) return undefined;
          try {
            return JSON.parse(event.content) as ProfileContent;
          } catch {
            return undefined;
          }
        })
      )
    );

    return combineLatest(profileObservables).pipe(
      map(profiles => profiles.filter((p): p is ProfileContent => p !== undefined))
    );
  }, [pubkeys.join(',')]);

  return useObservableState(profiles$, []);
}
