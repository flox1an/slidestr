import { useMemo } from 'react';
import { decode } from 'light-bolt11-decoder';
import { kinds } from 'nostr-tools';
import type { NostrEvent } from 'nostr-tools';

import { unixNow } from '../utils/time';

// Helper to get tag value from event
function getTagValue(event: NostrEvent, tagName: string): string | undefined {
  const tag = event.tags.find(t => t[0] === tagName);
  return tag ? tag[1] : undefined;
}

// Helper to create event tag reference
function createTagReference(event: NostrEvent): string[] {
  return ['e', event.id];
}

export function makeZapRequest({
  p,
  pubkey,
  amount,
  relays,
  event,
  comment,
}: {
  p: string;
  pubkey: string;
  amount: number;
  relays: string[];
  event?: NostrEvent;
  comment?: string;
}): NostrEvent {
  const msats = amount * 1000;
  return {
    pubkey,
    kind: kinds.ZapRequest,
    created_at: unixNow(),
    content: comment || '',
    tags: [['p', p], ...(event ? [createTagReference(event)] : []), ['amount', String(msats)], ['relays', ...relays]],
  } as NostrEvent;
}

export function getZapRequest(zap: NostrEvent): NostrEvent | undefined {
  let zapRequest = getTagValue(zap, 'description');
  if (zapRequest) {
    try {
      if (zapRequest.startsWith('%')) {
        zapRequest = decodeURIComponent(zapRequest);
      }
      return JSON.parse(zapRequest);
    } catch (e) {
      console.warn('Invalid zap', zapRequest);
    }
  }
}

export function getZapAmount(zap: NostrEvent): number {
  try {
    const invoice = getTagValue(zap, 'bolt11');
    if (invoice) {
      const decoded = decode(invoice) as { sections: { name: string; value: string }[] };
      const amount = decoded.sections.find(({ name }) => name === 'amount');
      return amount ? Number(amount.value) / 1000 : 0;
    }
    return 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export interface ZapRequest extends NostrEvent {
  created_at: number;
  amount: number;
  e?: string;
  p: string;
  a?: string;
  relays: string[];
}

export interface ZapsSummary {
  zapRequests: ZapRequest[];
  total: number;
}

export function parseZap(z: NostrEvent): ZapRequest | null {
  const zr = getZapRequest(z);
  if (!zr) {
    return null;
  }
  const eTag = zr ? zr.tags.find(t => t[0] === 'e') : null;
  const e = eTag ? eTag[1] : undefined;
  const pTag = zr ? zr.tags.find(t => t[0] === 'p') : null;
  const p = pTag ? pTag[1] : z.pubkey;
  const aTag = zr ? zr.tags.find(t => t[0] === 'a') : null;
  const a = aTag ? aTag[1] : undefined;
  const relaysTag = zr ? zr.tags.find(t => t[0] === 'relays') || [] : [];
  return {
    ...getZapRequest(z),
    amount: getZapAmount(z),
    e,
    p,
    a,
    relays: relaysTag.slice(1),
  } as ZapRequest;
}

export function zapsSummary(zaps: NostrEvent[]): ZapsSummary {
  const zapRequests = zaps
    .map(parseZap)
    .filter(z => z !== null)
    // @ts-ignore
    .sort((a, b) => b.amount - a.amount) as ZapRequest[];
  const total = zapRequests.reduce((acc, { amount }) => {
    return acc + amount;
  }, 0);
  return { zapRequests, total };
}

export interface ZapSplit {
  pubkey: string;
  percentage: number;
}

export function getZapSplits(ev: NostrEvent): ZapSplit[] {
  const zapTags = ev.tags.filter(t => t[0] === 'zap');
  return zapTagsToSplits(zapTags);
}

export function zapTagsToSplits(zapTags: string[][]): ZapSplit[] {
  const totalWeight = zapTags.reduce((acc, t) => {
    return acc + Number(t[3] ?? '');
  }, 0);
  return zapTags.map(t => {
    const [, pubkey, , weight] = t;
    const percentage = (Number(weight) / totalWeight) * 100;
    return { pubkey, percentage };
  });
}

interface Rank {
  pubkey: string;
  amount: number;
}

export function useRanking(zaps: NostrEvent[]): Rank[] {
  const { zapRequests } = useMemo(() => zapsSummary(zaps), [zaps]);

  const byAmount = useMemo(() => {
    return zapRequests.reduce(
      (result, element) => {
        const pubkey = element.pubkey;

        if (!result[pubkey]) {
          result[pubkey] = 0;
        }

        result[pubkey] += element.amount;

        return result;
      },
      {} as Record<string, number>
    );
  }, [zapRequests]);

  const ranking = useMemo(() => {
    return Object.entries(byAmount)
      .sort((a, b) => {
        return b[1] - a[1];
      })
      .map(e => {
        return { pubkey: e[0], amount: e[1] };
      });
  }, [byAmount]);

  return ranking;
}
