import { NostrImage } from '@/components/nostrImageDownload';
import { useSign } from '../ngine/context';
import { useSession } from '../ngine/state';
import { relayPool, eventStore } from '../nostr/core';
import { getWriteRelays } from '../nostr/relays';
import useLatestEvent from '../ngine/hooks/useLatestEvent';
import { unixNow } from '../ngine/time';
import type { NostrEvent } from 'nostr-tools';
import { useEffect, useMemo, useState } from 'react';

const useBookMarks = (pubkey?: string, activeImage?: NostrImage) => {
  const sign = useSign();
  const session = useSession();

  const bookMarkFilter = useMemo(() => ({ kinds: [10003], authors: (pubkey && [pubkey]) || [] }), [pubkey]);
  const [bookMarkList, setBookMarkList] = useState<NostrEvent | undefined>();

  const bookMarkListEvent = useLatestEvent(bookMarkFilter, {
    closeOnEose: false,
  });

  useEffect(() => {
    bookMarkListEvent != undefined && setBookMarkList(bookMarkListEvent);
  }, [bookMarkListEvent]);

  const publishBookMarks = async (pubkey: string, tags: string[][]) => {
    if (!session?.pubkey) return;

    const unsigned = {
      kind: 10003,
      tags,
      created_at: unixNow(),
      content: '',
    };

    try {
      const signed = await sign(unsigned);
      if (!signed) return;

      await relayPool.publish(getWriteRelays(session.pubkey), signed);
      eventStore.add(signed);
      setBookMarkList(signed);
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
