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
 * Gets an author's write relays for the outbox model
 * When fetching events from a specific author, query their write relays
 * Falls back to default relays if no relay list is found
 */
export function getAuthorReadRelays(pubkey: string): string[] {
  const relays = getUserRelays(pubkey);
  if (!relays || relays.write.length === 0) {
    return DEFAULT_RELAYS;
  }
  return relays.write;
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
