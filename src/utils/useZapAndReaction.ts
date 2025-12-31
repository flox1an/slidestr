import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSign } from '../ngine/context';
import { useSession, useNWC } from '../ngine/state';
import { useLnurl, loadInvoice, createZapRequestEvent } from '../ngine/lnurl';
import { payInvoiceViaNWC } from '../ngine/nwc';
import useProfile from '../ngine/hooks/useProfile';
import { relayPool, eventStore, DEFAULT_RELAYS } from '../nostr/core';
import { getWriteRelays } from '../nostr/relays';
import { NostrImage } from '../components/nostrImageDownload';
import type { Filter } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import useReposts from './useReposts';

export type HeartState = 'none' | 'liked' | 'liking';
export type ZapState = 'none' | 'zapped' | 'zapping' | 'error';

const DEFAULT_ZAP_AMOUNT = 21;

const useZapsAndReations = (currentImageData?: NostrImage, userNPub?: string) => {
  const sign = useSign();
  const session = useSession();
  const reposts = useReposts(userNPub);
  const nwc = useNWC();

  // Get author profile for LNURL
  const authorProfile = useProfile(currentImageData?.authorId || '');
  const { data: lnurlService } = useLnurl(authorProfile);

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
  }, [currentImageData, userNPub]);

  const heartClick = async (currentImage: NostrImage) => {
    setHeartState('liking');
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

    await relayPool.publish(getWriteRelays(session.pubkey), signed);
    eventStore.add(signed);
    setHeartState('liked');
    currentImage.post.wasLiked = true;
  };

  const zapClick = useCallback(async (
    currentImage: NostrImage,
    amount: number = DEFAULT_ZAP_AMOUNT,
    comment?: string
  ) => {
    setZapState('zapping');

    if (!session?.pubkey) {
      setZapState('error');
      return;
    }

    if (!lnurlService) {
      setZapState('error');
      return;
    }

    if (!nwc) {
      setZapState('error');
      return;
    }

    try {
      // Create zap request
      const lnurlEncoded = authorProfile?.lud16 || '';
      const zapRequest = createZapRequestEvent(
        session.pubkey,
        currentImage.authorId,
        currentImage.noteId,
        amount * 1000, // Convert to msats
        DEFAULT_RELAYS,
        lnurlEncoded,
        comment
      );

      // Sign zap request
      const signedZapRequest = await sign(zapRequest);
      if (!signedZapRequest) {
        setZapState('error');
        return;
      }

      // Get invoice from LNURL service
      const invoiceResponse = await loadInvoice(
        lnurlService,
        amount,
        comment,
        signedZapRequest
      );

      if (!invoiceResponse?.pr) {
        setZapState('error');
        return;
      }

      // Pay via NWC
      const payResult = await payInvoiceViaNWC(nwc, invoiceResponse.pr);

      if ('error' in payResult) {
        setZapState('error');
        return;
      }

      setZapState('zapped');

      // Reset after animation
      setTimeout(() => setZapState('none'), 2000);
    } catch (err) {
      console.error('Zap failed:', err);
      setZapState('error');
    }
  }, [session, nwc, lnurlService, authorProfile, sign]);

  const repostClick = async () => {
    if (!session?.pubkey) return;

    const orgEvent = currentImageData?.post.event;
    if (!orgEvent || !orgEvent.id) return;

    // Use a default relay URL since nostr-tools events don't track relay origin
    const relayUrl = 'wss://relay.damus.io';

    const unsigned = {
      kind: 6, // Repost
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify(orgEvent),
      tags: [
        ['e', orgEvent.id, relayUrl],
        ['p', orgEvent.pubkey],
      ],
    };

    const signed = await sign(unsigned);
    if (!signed) return;

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
    hasLnurl: !!lnurlService,
    hasNwc: !!nwc,
  };
};

export default useZapsAndReations;
