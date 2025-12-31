import { useState, useEffect } from 'react';
import { kinds } from 'nostr-tools';
import type { NostrEvent } from 'nostr-tools';
import { eventStore, relayPool, DEFAULT_RELAYS } from '../nostr/core';
import { getZapAmount } from '../ngine/nostr/nip57';

export function useZapCount(eventId: string | undefined): number {
  const [totalSats, setTotalSats] = useState(0);

  useEffect(() => {
    if (!eventId) {
      setTotalSats(0);
      return;
    }

    // Check cache first
    const cached = eventStore.getEventsForFilters([
      { kinds: [kinds.Zap], '#e': [eventId] }
    ]);

    if (cached.length > 0) {
      const total = cached.reduce((sum: number, event: NostrEvent) => {
        return sum + getZapAmount(event);
      }, 0);
      setTotalSats(total);
    }

    // Subscribe to zap receipts
    const subscription = relayPool
      .subscription(DEFAULT_RELAYS, [{ kinds: [kinds.Zap], '#e': [eventId] }])
      .subscribe({
        next: (event) => {
          if (typeof event === 'string') return;
          const nostrEvent = event as NostrEvent;
          eventStore.add(nostrEvent);

          // Recalculate total
          const allZaps = eventStore.getEventsForFilters([
            { kinds: [kinds.Zap], '#e': [eventId] }
          ]);
          const total = allZaps.reduce((sum: number, e: NostrEvent) => {
            return sum + getZapAmount(e);
          }, 0);
          setTotalSats(total);
        },
        error: (err) => console.error('Zap subscription error:', err),
      });

    return () => subscription.unsubscribe();
  }, [eventId]);

  return totalSats;
}

// Format sats for display (e.g., 1000 -> "1k", 1500000 -> "1.5M")
export function formatSats(sats: number): string {
  if (sats === 0) return '';
  if (sats < 1000) return sats.toString();
  if (sats < 1000000) return (sats / 1000).toFixed(sats % 1000 === 0 ? 0 : 1) + 'k';
  return (sats / 1000000).toFixed(1) + 'M';
}
