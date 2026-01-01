import type { NostrEvent } from 'nostr-tools';

export function tagValues(ev: NostrEvent, tag: string): string[] {
  return ev.tags.filter(t => t[0] === tag).map(t => t[1]);
}
