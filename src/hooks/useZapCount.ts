import { useState, useEffect } from 'react';
import { eventStore, relayPool, DEFAULT_RELAYS } from '../nostr/core';
import type { NostrEvent } from 'nostr-tools';

// Decode bolt11 amount from invoice (simplified - gets amount in sats)
function decodeBolt11Amount(bolt11: string): number {
  // Look for amount in the invoice format: lnbc<amount><multiplier>
  const match = bolt11.toLowerCase().match(/^lnbc(\d+)([munp]?)/);
  if (!match) return 0;

  const amount = parseInt(match[1], 10);
  const multiplier = match[2];

  switch (multiplier) {
    case 'm': return amount * 100000; // milli-btc to sats
    case 'u': return amount * 100; // micro-btc to sats
    case 'n': return amount / 10; // nano-btc to sats
    case 'p': return amount / 10000; // pico-btc to sats
    default: return amount * 100000000; // btc to sats
  }
}

export function useZapCount(eventId: string | undefined): number {
  const [totalSats, setTotalSats] = useState(0);

  useEffect(() => {
    if (!eventId) {
      setTotalSats(0);
      return;
    }

    // Check cache first
    const cached = eventStore.getEventsForFilters([
      { kinds: [9735], '#e': [eventId] }
    ]);

    if (cached.length > 0) {
      const total = cached.reduce((sum: number, event: NostrEvent) => {
        const bolt11Tag = event.tags.find((t: string[]) => t[0] === 'bolt11');
        if (bolt11Tag) {
          return sum + decodeBolt11Amount(bolt11Tag[1]);
        }
        return sum;
      }, 0);
      setTotalSats(total);
    }

    // Subscribe to zap receipts
    const subscription = relayPool
      .subscription(DEFAULT_RELAYS, [{ kinds: [9735], '#e': [eventId] }])
      .subscribe(event => {
        if (typeof event === 'string') return;
        const nostrEvent = event as NostrEvent;
        eventStore.add(nostrEvent);

        // Recalculate total
        const allZaps = eventStore.getEventsForFilters([
          { kinds: [9735], '#e': [eventId] }
        ]);
        const total = allZaps.reduce((sum: number, e: NostrEvent) => {
          const bolt11Tag = e.tags.find((t: string[]) => t[0] === 'bolt11');
          if (bolt11Tag) {
            return sum + decodeBolt11Amount(bolt11Tag[1]);
          }
          return sum;
        }, 0);
        setTotalSats(total);
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
