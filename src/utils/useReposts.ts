import { useMemo } from 'react';
import useEvents from '../ngine/hooks/useEvents';
import { nip19 } from 'nostr-tools';

const KIND_REPOST = 6;

const useReposts = (npub?: string) => {
  const pubkey = npub && (nip19.decode(npub).data as string);
  const { events } = useEvents(
    { kinds: [KIND_REPOST], authors: pubkey ? [pubkey] : [], limit: 100 },
    { disable: !npub }
  );

  const reposts = useMemo(() => events.flatMap(e => e.getMatchingTags('e').map(t => t[1]).flat()), [events]);

  return reposts;
};

export default useReposts;
