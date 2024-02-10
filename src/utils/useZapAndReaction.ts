import { NostrImage } from '../components/nostrImageDownload';
import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { nip19 } from 'nostr-tools';
import { useEffect, useState } from 'react';

export type HeartState = 'none' | 'liked' | 'liking';
export type ZapState = 'none' | 'zapped' | 'zapping' | 'error';

const useZapsAndReations = (currentImageData?: NostrImage, userNPub?: string) => {
  const { ndk } = useNDK();

  const [zapState, setZapState] = useState<ZapState>('none');
  const [heartState, setHeartState] = useState<HeartState>('none');

  const fetchLikeAndZaps = async (noteIds: string[], selfNPub: string) => {
    const filter: NDKFilter = { kinds: [7], '#e': noteIds }; // Kind Reaction

    filter.authors = [nip19.decode(selfNPub).data as string];

    const events = await ndk?.fetchEvents(filter);

    return { selfLiked: events && events.size > 0 };
  };

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
    if (!userNPub) return;

    const ev = new NDKEvent(ndk, {
      kind: 7, // Reaction
      pubkey: nip19.decode(userNPub).data as string,
      created_at: Math.floor(new Date().getTime() / 1000),
      content: '+',
      tags: [
        ['e', currentImage.noteId],
        ['p', currentImage.authorId],
      ],
    });
    console.log(ev);
    await ev.publish();
    setHeartState('liked');
    currentImage.post.wasLiked = true;
  };

  const zapClick = async (currentImage: NostrImage) => {
    setZapState('zapping');
    console.log('zapClick');
    if (!userNPub) return;

    if (!window.webln) {
      console.error('No webln found');
      setZapState('error');
      return;
    }
    console.log('zapClick2');

    const ev = await ndk?.fetchEvent(currentImage.noteId);

    if (!ev) {
      console.error('No event found for noteId: ' + currentImage.noteId);
      setZapState('error');
      return;
    }

    console.log(ev);
    const invoice = await ev.zap(21000, 'Nice!');
    console.log('zapClick3');

    console.log(invoice);
    if (!invoice) {
      console.error('No invoice found');
      setZapState('error');
      return;
    }
    await window.webln.enable();
    await window.webln.sendPayment(invoice);

    setZapState('zapped');
    currentImage.post.wasZapped = true;
  };

  return {
    zapState,
    heartState,
    zapClick,
    heartClick,
  };
};

export default useZapsAndReations;
