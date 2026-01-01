import { useMemo } from 'react';
import type { NostrEvent, Filter } from 'nostr-tools';
import { kinds } from 'nostr-tools';

import useEvents from './useEvents';
import { zapsSummary, ZapRequest } from '../nostr/nip57';
import { ReactionKind } from '../types/nostr';

export type ReactionEvents = {
  events: NostrEvent[];
  zaps: {
    zapRequests: ZapRequest[];
    total: number;
  };
  reactions: NostrEvent[];
  replies: NostrEvent[];
  reposts: NostrEvent[];
  bookmarks: NostrEvent[];
};

export default function useReactions(event: NostrEvent, reactionKinds: ReactionKind[], live = true): ReactionEvents {
  const filter = useMemo(() => {
    // Build filter to find reactions to this event
    const f: Filter = {
      kinds: reactionKinds,
      '#e': [event.id],
    };
    return f;
  }, [event, reactionKinds]);

  const { events } = useEvents(filter, {
    disable: !live,
    closeOnEose: false,
  });

  const zaps = useMemo(() => events.filter(e => e.kind === kinds.Zap), [events]);
  const { zapRequests, total } = useMemo(() => zapsSummary(zaps), [zaps]);
  const reactions = useMemo(() => events.filter(e => e.kind === kinds.Reaction), [events]);
  const replies = useMemo(() => events.filter(e => e.kind === kinds.ShortTextNote), [events]);
  const reposts = useMemo(
    () => events.filter(e => e.kind === kinds.Repost || e.kind === kinds.GenericRepost),
    [events]
  );
  const bookmarks = useMemo(
    () =>
      events.filter(
        e =>
          e.kind === kinds.Bookmarksets ||
          e.kind === kinds.RelayList ||
          e.kind === kinds.Emojisets
      ),
    [events]
  );

  return {
    events,
    zaps: {
      zapRequests,
      total,
    },
    reactions,
    replies,
    reposts,
    bookmarks,
  };
}
