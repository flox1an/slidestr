import { getSeenRelays } from 'applesauce-core/helpers';
import { kinds } from 'nostr-tools';
import type { NostrEvent } from 'nostr-tools';
import { eventStore, relayPool, DEFAULT_RELAYS } from './core';

/**
 * Parsed relay list with separate read and write relay arrays
 */
export interface ParsedRelays {
  read: string[];
  write: string[];
}

/**
 * Parses a NIP-65 relay list event into read/write arrays
 *
 * NIP-65 tag format: ['r', 'wss://relay.url', 'read'|'write'|undefined]
 * - No marker or both = read AND write
 * - 'read' = read only
 * - 'write' = write only
 */
export function parseRelayList(event: NostrEvent): ParsedRelays {
  const read: string[] = [];
  const write: string[] = [];

  for (const tag of event.tags) {
    if (tag[0] !== 'r' || !tag[1]) continue;

    const relayUrl = tag[1];
    const marker = tag[2];

    if (!marker) {
      // No marker means both read and write
      read.push(relayUrl);
      write.push(relayUrl);
    } else if (marker === 'read') {
      read.push(relayUrl);
    } else if (marker === 'write') {
      write.push(relayUrl);
    }
  }

  return { read, write };
}

/**
 * Gets a user's relay preferences from the event store
 * Returns undefined if no relay list event is found
 */
export function getUserRelays(pubkey: string): ParsedRelays | undefined {
  const event = eventStore.getReplaceable(kinds.RelayList, pubkey);
  if (!event) return undefined;
  return parseRelayList(event);
}

/**
 * Gets an author's write relays for the outbox model.
 * When fetching an event from a specific author, query these relays.
 */
export function getAuthorWriteRelays(pubkey: string): string[] {
  return getUserRelays(pubkey)?.write ?? [];
}

/**
 * Returns a relay where an event can be fetched.
 * Prefer relays where it was actually observed; fall back to the author's
 * advertised write relays when that provenance is unavailable.
 */
export function getEventRelayHint(event: NostrEvent, relayHints: string[] = []): string | undefined {
  return [...new Set([...relayHints, ...(getSeenRelays(event) ?? []), ...getAuthorWriteRelays(event.pubkey)])][0];
}

/**
 * Gets write relays for publishing events
 * If pubkey is provided, returns that user's write relays
 * Falls back to default relays if no relay list is found or pubkey is undefined
 */
export function getWriteRelays(pubkey: string | undefined): string[] {
  if (!pubkey) {
    return DEFAULT_RELAYS;
  }

  const relays = getUserRelays(pubkey);
  if (!relays || relays.write.length === 0) {
    return DEFAULT_RELAYS;
  }
  return relays.write;
}

/**
 * Syncs the relay pool with a user's relays
 * Connects to all read and write relays from the user's NIP-65 relay list
 */
export function syncUserRelays(pubkey: string): void {
  const relays = getUserRelays(pubkey);
  if (!relays) {
    console.log('No relay list found for user, using default relays');
    return;
  }

  // Combine unique relays from both read and write lists
  const allRelays = [...new Set([...relays.read, ...relays.write])];

  for (const url of allRelays) {
    relayPool.relay(url);
  }

  console.log('Synced user relays:', allRelays);
}

/**
 * Returns the default relay list
 */
export function getDefaultRelays(): string[] {
  return DEFAULT_RELAYS;
}

/**
 * Gets an author's inbox (read) relays combined with default relays
 * When sending events TO a specific author (like zap receipts), use their read relays
 * plus default relays for redundancy
 */
export function getInboxRelays(pubkey: string): string[] {
  const relays = getUserRelays(pubkey);
  const authorRelays = relays?.read || [];
  // Combine author inbox relays with default relays, removing duplicates
  return [...new Set([...authorRelays, ...DEFAULT_RELAYS])];
}

/**
 * Returns the relays to which an event should be published under NIP-65:
 * the author's write relays plus each tagged recipient's advertised read relays.
 */
export function getPublicationRelays(authorPubkey: string, taggedPubkeys: string[]): string[] {
  const recipientRelays = taggedPubkeys.flatMap(pubkey => getUserRelays(pubkey)?.read ?? []);
  return [...new Set([...getWriteRelays(authorPubkey), ...recipientRelays])];
}
