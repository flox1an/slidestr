import { useSign } from '../ngine/context';
import { useSession } from '../ngine/state';
import { relayPool, eventStore } from '../nostr/core';
import { getWriteRelays } from '../nostr/relays';
import { NostrImage } from '../components/nostrImageDownload';
import type { Filter } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import { useEffect, useMemo, useState } from 'react';
import useReposts from './useReposts';

export type HeartState = 'none' | 'liked' | 'liking';
export type ZapState = 'none' | 'zapped' | 'zapping' | 'error';

const useZapsAndReations = (currentImageData?: NostrImage, userNPub?: string) => {
  const sign = useSign();
  const session = useSession();
  const reposts = useReposts(userNPub);

  const [zapState, setZapState] = useState<ZapState>('none');
  const [heartState, setHeartState] = useState<HeartState>('none');

  const fetchLikeAndZaps = async (noteIds: string[], selfNPub: string) => {
    const filter: Filter = { kinds: [7], '#e': noteIds }; // Kind Reaction

    filter.authors = [nip19.decode(selfNPub).data as string];

    // Use eventStore to check for existing reactions
    const events = eventStore.getEventsForFilters([filter]);

    return { selfLiked: events && events.length > 0 };
  };

  const repostState = useMemo(
    () => reposts.some(r => r == currentImageData?.post.event.id),
    [currentImageData?.post.event.id, reposts]
  );

  useEffect(() => {
    setZapState('none');
    setHeartState('none');

    if (!currentImageData?.noteId || !userNPub) return;

    if (currentImageData.post.wasLiked !== undefined) {
      setHeartState(currentImageData.post.wasLiked ? 'liked' : 'none');
      return;
    }

    fetchLikeAndZaps([currentImageData.noteId], userNPub).then(likes => {
      currentImageData.post.wasLiked = likes.selfLiked;
      setHeartState(likes.selfLiked ? 'liked' : 'none');
    });
  }, [currentImageData, currentImageData?.noteId, userNPub]);

  const heartClick = async (currentImage: NostrImage) => {
    setHeartState('liking');
    console.log('heartClick');
    if (!session?.pubkey) return;

    const unsigned = {
      kind: 7, // Reaction
      created_at: Math.floor(Date.now() / 1000),
      content: '+',
      tags: [
        ['e', currentImage.noteId],
        ['p', currentImage.authorId],
      ],
    };

    const signed = await sign(unsigned);
    if (!signed) {
      setHeartState('none');
      return;
    }

    console.log(signed);
    await relayPool.publish(getWriteRelays(session.pubkey), signed);
    eventStore.add(signed);
    setHeartState('liked');
    currentImage.post.wasLiked = true;
  };

  const zapClick = async (currentImage: NostrImage) => {
    setZapState('zapping');
    console.log('zapClick');
    if (!session?.pubkey) return;

    if (!window.webln) {
      console.error('No webln found');
      setZapState('error');
      return;
    }
    console.log('zapClick2');

    // Get the event from event store
    const ev = eventStore.getEvent(currentImage.noteId);

    if (!ev) {
      console.error('No event found for noteId: ' + currentImage.noteId);
      setZapState('error');
      return;
    }

    console.log(ev);

    // For zaps, we need to use a zap service - this requires NIP-57 implementation
    // For now, we'll keep the basic structure but note that full zap support
    // would require integrating with a zap service like nostr-zap or similar
    console.error('Zap functionality requires NIP-57 implementation');
    setZapState('error');
    return;

    // TODO: Implement proper NIP-57 zap flow
    // This would involve:
    // 1. Fetching the author's lnurl from their profile
    // 2. Creating a zap request event
    // 3. Getting an invoice from the lnurl service
    // 4. Paying the invoice via webln
  };

  const repostClick = async () => {
    if (!session?.pubkey) return;

    const orgEvent = currentImageData?.post.event;
    if (!orgEvent) return;

    const relayUrl = orgEvent.relay?.url;
    if (!relayUrl) {
      console.error('no relay url found for original event.');
      return;
    }

    const unsigned = {
      kind: 6, // Repost
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify(orgEvent.rawEvent),
      tags: [
        ['e', orgEvent.id, relayUrl],
        ['p', orgEvent.author.pubkey],
      ],
    };

    const signed = await sign(unsigned);
    if (!signed) return;

    console.log(signed);
    await relayPool.publish(getWriteRelays(session.pubkey), signed);
    eventStore.add(signed);
  };

  return {
    zapState,
    heartState,
    zapClick,
    heartClick,
    repostClick,
    repostState,
  };
};

export default useZapsAndReations;
