import { useState, useEffect, useMemo, useRef } from 'react';
import { useObservable, useSubscription } from 'observable-hooks';
import { createTimelineLoader } from 'applesauce-loaders/loaders';
import type { Filter, NostrEvent } from 'nostr-tools';
import { eventStore, relayPool, cacheRequest, DEFAULT_RELAYS } from '../../nostr/core';
import { hashSha256 } from '../utils';

export interface SubscriptionOptions {
  disable?: boolean;
  closeOnEose?: boolean;
}

export default function useEvents(
  filter: Filter | Filter[],
  opts?: SubscriptionOptions,
  relays?: string[]
) {
  const [eose, setEose] = useState(false);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const effectiveRelays = relays?.length ? relays : DEFAULT_RELAYS;
  const normalizedFilter = Array.isArray(filter) ? filter[0] : filter;

  const id = useMemo(() => hashSha256(filter), [filter]);

  // Create and manage loader subscription
  useEffect(() => {
    if (opts?.disable || !normalizedFilter) {
      setEvents([]);
      setEose(false);
      return;
    }

    // Reset state for new subscription
    setEose(false);

    // Clean up previous subscription
    subscriptionRef.current?.unsubscribe();

    const loader = createTimelineLoader(relayPool, effectiveRelays, normalizedFilter, {
      eventStore,
      cache: cacheRequest,
      limit: 100,
    });

    const sub = loader().subscribe({
      complete: () => setEose(true),
      error: err => console.error('Timeline loader error:', err),
    });

    subscriptionRef.current = sub;

    return () => {
      sub.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [id, opts?.disable]);

  // Create observable for timeline from event store
  const timeline$ = useObservable(
    () => eventStore.timeline(normalizedFilter),
    [normalizedFilter]
  );

  // Subscribe to timeline updates
  useSubscription(timeline$, {
    next: (timelineEvents: NostrEvent[]) => {
      if (!opts?.disable) {
        setEvents(timelineEvents);
      }
    },
  });

  return { id, eose, events };
}
