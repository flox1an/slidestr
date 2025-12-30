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
  image?: string; // alias for picture, used by some clients
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
            const content = JSON.parse(event.content) as ProfileContent;
            // Normalize: nostr profiles use 'picture', map to 'image' for compatibility
            if (content.picture && !content.image) {
              content.image = content.picture;
            }
            // Normalize: some clients use 'display_name', map to 'displayName'
            if (content.display_name && !content.displayName) {
              content.displayName = content.display_name;
            }
            return content;
          } catch {
            return undefined;
          }
        })
      ),
    [pubkey]
  );

  return useObservableState(profile$, undefined);
}
