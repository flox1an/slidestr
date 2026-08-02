import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useSign } from '../context/NgineContext';
import { useSession, useNWC } from '../state/atoms';
import { useLnurl, loadInvoice, createZapRequestEvent } from '../nostr/lnurl';
import { payInvoiceViaNWC } from '../nostr/nwc';
import useProfile from '../hooks/useProfile';
import { relayPool, eventStore, DEFAULT_RELAYS } from '../nostr/core';
import { getEventRelayHint, getInboxRelays, getPublicationRelays } from '../nostr/relays';
import { NostrImage } from '../components/nostrImageDownload';
import { kinds, nip19 } from 'nostr-tools';
import useReposts from './useReposts';
import useLatestEvent from '../hooks/useLatestEvent';

export type HeartState = 'none' | 'liked' | 'liking';
export type ZapState = 'none' | 'zapped' | 'zapping' | 'error';

const DEFAULT_ZAP_AMOUNT = 21;

const useZapsAndReations = (currentImageData?: NostrImage, userNPub?: string) => {
  const sign = useSign();
  const session = useSession();
  const reposts = useReposts(userNPub);
  const nwc = useNWC();

  // Load the target author's NIP-65 relay list before publishing an interaction.
  useLatestEvent(
    {
      kinds: [kinds.RelayList],
      authors: currentImageData?.authorId ? [currentImageData.authorId] : [],
    },
    { disable: !currentImageData?.authorId, closeOnEose: true }
  );

  // Get author profile for LNURL
  const authorProfile = useProfile(currentImageData?.authorId || '');
  const { data: lnurlService } = useLnurl(authorProfile);

  const [zapState, setZapState] = useState<ZapState>('none');
  const [heartState, setHeartState] = useState<HeartState>('none');
  const checkedLikeRef = useRef<string | null>(null);
  const checkedZapRef = useRef<string | null>(null);

  const repostState = useMemo(
    () => reposts.some(r => r == currentImageData?.post.event.id),
    [currentImageData?.post.event.id, reposts]
  );

  // Check if user has liked the current image
  useEffect(() => {
    setHeartState('none');

    if (!currentImageData?.noteId || !userNPub) return;

    // Already cached
    if (currentImageData.post.wasLiked !== undefined) {
      setHeartState(currentImageData.post.wasLiked ? 'liked' : 'none');
      return;
    }

    // Skip if we already checked this noteId
    if (checkedLikeRef.current === currentImageData.noteId) return;
    checkedLikeRef.current = currentImageData.noteId;

    // Query relays for user's reactions to this note
    const authorPubkey = nip19.decode(userNPub).data as string;
    const sub = relayPool
      .subscription(DEFAULT_RELAYS, [{ kinds: [7], '#e': [currentImageData.noteId], authors: [authorPubkey] }])
      .subscribe({
        next: (event) => {
          if (typeof event === 'string') return;
          currentImageData.post.wasLiked = true;
          setHeartState('liked');
        },
        complete: () => {
          if (currentImageData.post.wasLiked === undefined) {
            currentImageData.post.wasLiked = false;
          }
        },
      });

    return () => sub.unsubscribe();
  }, [currentImageData, userNPub]);

  // Check if user has zapped the current image
  useEffect(() => {
    setZapState('none');

    if (!currentImageData?.noteId || !userNPub) return;

    // Already cached
    if (currentImageData.post.wasZapped !== undefined) {
      setZapState(currentImageData.post.wasZapped ? 'zapped' : 'none');
      return;
    }

    // Skip if we already checked this noteId
    if (checkedZapRef.current === currentImageData.noteId) return;
    checkedZapRef.current = currentImageData.noteId;

    // Query relays for zap receipts (kind 9735) on this note
    // We check the 'description' tag which contains the zap request with the sender's pubkey
    const userPubkey = nip19.decode(userNPub).data as string;
    const sub = relayPool
      .subscription(DEFAULT_RELAYS, [{ kinds: [9735], '#e': [currentImageData.noteId] }])
      .subscribe({
        next: (event) => {
          if (typeof event === 'string') return;
          // Parse the description tag to find the zap request
          const descTag = event.tags.find((t: string[]) => t[0] === 'description');
          if (descTag && descTag[1]) {
            try {
              const zapRequest = JSON.parse(descTag[1]);
              if (zapRequest.pubkey === userPubkey) {
                currentImageData.post.wasZapped = true;
                setZapState('zapped');
              }
            } catch {
              // Invalid JSON in description tag
            }
          }
        },
        complete: () => {
          if (currentImageData.post.wasZapped === undefined) {
            currentImageData.post.wasZapped = false;
          }
        },
      });

    return () => sub.unsubscribe();
  }, [currentImageData, userNPub]);

  const heartClick = async (currentImage: NostrImage) => {
    setHeartState('liking');
    if (!session?.pubkey) return;

    const relayHint = getEventRelayHint(currentImage.post.event, currentImage.relayHints);
    const unsigned = {
      kind: 7, // Reaction
      created_at: Math.floor(Date.now() / 1000),
      content: '+',
      tags: [
        ['e', currentImage.noteId, relayHint ?? ''],
        ['p', currentImage.authorId],
        ['k', String(currentImage.post.event.kind)],
      ],
    };

    const signed = await sign(unsigned);
    if (!signed) {
      setHeartState('none');
      return;
    }

    await relayPool.publish(getPublicationRelays(session.pubkey, [currentImage.authorId]), signed);
    eventStore.add(signed);
    setHeartState('liked');
    currentImage.post.wasLiked = true;
  };

  // Generate invoice without paying (for QR code fallback)
  const generateInvoice = useCallback(async (
    currentImage: NostrImage,
    amount: number = DEFAULT_ZAP_AMOUNT,
    comment?: string
  ): Promise<string | null> => {
    if (!session?.pubkey) return null;
    if (!lnurlService) return null;

    try {
      const lnurlEncoded = authorProfile?.lud16 || '';
      // Use author's inbox relays so they receive the zap receipt
      const authorInboxRelays = getInboxRelays(currentImage.authorId);
      const zapRequest = createZapRequestEvent(
        session.pubkey,
        currentImage.authorId,
        currentImage.noteId,
        amount * 1000,
        authorInboxRelays,
        lnurlEncoded,
        comment
      );

      const signedZapRequest = await sign(zapRequest);
      if (!signedZapRequest) return null;

      const invoiceResponse = await loadInvoice(
        lnurlService,
        amount,
        comment,
        signedZapRequest
      );

      return invoiceResponse?.pr || null;
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      return null;
    }
  }, [session, lnurlService, authorProfile, sign]);

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
      // Create zap request using author's inbox relays
      const lnurlEncoded = authorProfile?.lud16 || '';
      const authorInboxRelays = getInboxRelays(currentImage.authorId);
      const zapRequest = createZapRequestEvent(
        session.pubkey,
        currentImage.authorId,
        currentImage.noteId,
        amount * 1000, // Convert to msats
        authorInboxRelays,
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
      currentImage.post.wasZapped = true;
    } catch (err) {
      console.error('Zap failed:', err);
      setZapState('error');
    }
  }, [session, nwc, lnurlService, authorProfile, sign]);

  const repostClick = async () => {
    if (!session?.pubkey) return;

    const orgEvent = currentImageData?.post.event;
    if (!orgEvent || !orgEvent.id) return;

    const relayUrl = getEventRelayHint(orgEvent, currentImageData.relayHints);
    if (!relayUrl) {
      console.warn('Cannot repost event without a source relay:', orgEvent.id);
      return;
    }

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

    await relayPool.publish(getPublicationRelays(session.pubkey, [orgEvent.pubkey]), signed);
    eventStore.add(signed);
  };

  return {
    zapState,
    heartState,
    zapClick,
    heartClick,
    repostClick,
    repostState,
    generateInvoice,
    hasLnurl: !!lnurlService,
    hasNwc: !!nwc,
  };
};

export default useZapsAndReations;
