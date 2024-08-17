import { useMemo } from 'react';
import useEvent from '../ngine/hooks/useEvent';
import { nip19 } from 'nostr-tools';

const useAuthorsFromList = (listAddr?: string): string[] => {
  const validListAttr = listAddr?.indexOf('naddr') == 0;
  const addr = listAddr ? (nip19.decode(listAddr).data as nip19.AddressPointer) : undefined;
  const addrIsDefined = addr && addr.pubkey && addr.identifier;

  const authorFilter = addr?.pubkey ? [addr.pubkey] : [];
  const identFilter = addr?.identifier ? [addr.identifier] : [];

  const listEvent = useEvent(
    { kinds: [30000], authors: authorFilter, '#d': identFilter },
    { disable: !validListAttr || !addrIsDefined || authorFilter.length == 0 || identFilter.length == 0 }
  );

  const authors: string[] = useMemo(() => {
    return (
      (validListAttr &&
        listEvent
          ?.getMatchingTags('p')
          .map(t => t[1])
          .flat()) ||
      []
    );
  }, [listEvent, validListAttr]);

  return authors;
};

export default useAuthorsFromList;
