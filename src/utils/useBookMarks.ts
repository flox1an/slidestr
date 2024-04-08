import { NostrImage } from '@/components/nostrImageDownload';
import { useNDK } from '../ngine/context';
import useLatestEvent from '../ngine/hooks/useLatestEvent';
import { unixNow } from '../ngine/time';
import { NDKEvent, NDKSubscriptionCacheUsage, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { useEffect, useMemo, useState } from 'react';

const useBookMarks = (pubkey?: string, activeImage?: NostrImage) => {
  const ndk = useNDK();

  const bookMarkFilter = useMemo(() => ({ kinds: [10003], authors: (pubkey && [pubkey]) || [] }), [pubkey]);
  const [bookMarkList, setBookMarkList] = useState<NostrEvent | undefined>();

  const bookMarkListEvent = useLatestEvent(bookMarkFilter, {
    cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
    closeOnEose: false,
  });

  useEffect(() => {
    bookMarkListEvent != undefined && setBookMarkList(bookMarkListEvent.rawEvent());
  }, [bookMarkListEvent]);

  const publishBookMarks = async (pubkey: string, tags: NDKTag[]) => {
    const ev = {
      pubkey: pubkey,
      kind: 10003,
      tags,
      created_at: unixNow(),
      content: '',
    };
    try {
      const signed = new NDKEvent(ndk, ev);
      await signed.sign();
      await signed.publish();
      setBookMarkList(signed.rawEvent());
    } catch (error) {
      console.error(error);
    }
  };

  const bookmarkState = useMemo(
    () => bookMarkList && bookMarkList.tags.some(t => t[0] == 'e' && t[1] == activeImage?.post.event.id),
    [bookMarkList, activeImage?.post.event.id]
  );

  const bookmarkClick = async () => {
    if (!bookMarkList) return;
    if (activeImage == undefined) return;
    if (pubkey == undefined) return;

    const newTagList = bookMarkList.tags.filter(t => t[0] == 'e' && t[1] != activeImage?.post.event.id);
    if (bookmarkState) {
      if (newTagList.length < bookMarkList.tags.length) {
        await publishBookMarks(pubkey, newTagList);
        bookMarkList.tags = newTagList;
      }
    } else {
      newTagList.push(['e', activeImage.post.event.id]);
      await publishBookMarks(pubkey, newTagList);
    }
  };

  return { bookmarkClick, bookmarkState };
};

export default useBookMarks;
