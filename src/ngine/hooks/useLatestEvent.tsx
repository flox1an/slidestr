import { useEffect, useMemo, useRef } from 'react';
import { useObservableState } from 'observable-hooks';
import { createTimelineLoader } from 'applesauce-loaders/loaders';
import type { Filter, NostrEvent } from 'nostr-tools';
import { map } from 'rxjs/operators';
import { eventStore, relayPool, cacheRequest, DEFAULT_RELAYS } from '../../nostr/core';
import { hashSha256 } from '../utils';
import { SubscriptionOptions } from './useEvents';

export default function useLatestEvent(
  filter: Filter | Filter[],
  opts?: SubscriptionOptions,
  relays?: string[]
): NostrEvent | undefined {
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const effectiveRelays = relays?.length ? relays : DEFAULT_RELAYS;

  // Normalize array filter to single filter (take first if array)
  const normalizedFilter = Array.isArray(filter) ? filter[0] : filter;

  const id = useMemo(() => hashSha256(filter), [filter]);

  // Create and manage loader subscription
  useEffect(() => {
    if (opts?.disable || !normalizedFilter) {
      return;
    }

    // Clean up previous subscription
    subscriptionRef.current?.unsubscribe();

    const loader = createTimelineLoader(relayPool, effectiveRelays, normalizedFilter, {
      eventStore,
      cache: cacheRequest,
      limit: 1,
    });

    const sub = loader().subscribe({
      error: err => console.error('Latest event loader error:', err),
    });

    subscriptionRef.current = sub;

    return () => {
      sub.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [id, opts?.disable]);

  // Create observable for timeline from event store and return first (latest) event
  const event$ = useMemo(
    () =>
      eventStore.timeline(normalizedFilter).pipe(
        map((events: NostrEvent[]) => (events.length > 0 ? events[0] : undefined))
      ),
    [normalizedFilter]
  );

  return useObservableState(event$, undefined);
}
