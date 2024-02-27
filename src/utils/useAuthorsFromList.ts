import useEvent from '../ngine/hooks/useEvent';
import { nip19 } from 'nostr-tools';

const useAuthorsFromList = (listAddr?: string) => {
  const validListAttr = listAddr?.indexOf('naddr') == 0;
  const addr = listAddr ? (nip19.decode(listAddr).data as nip19.AddressPointer) : undefined;
  const addrIsDefined = addr && addr.pubkey && addr.identifier;

  const authorFilter = addr?.pubkey ? [addr.pubkey] : [];
  const identFilter = addr?.identifier ? [addr.identifier] : [];

  const listEvent = useEvent(
    { kinds: [30000], authors: authorFilter, '#d': identFilter },
    { disable: !validListAttr && !addrIsDefined }
  );
  const authors: string[] =
    (validListAttr &&
      listEvent
        ?.getMatchingTags('p')
        .map(t => t[1])
        .flat()) ||
    [];

  return authors;
};

export default useAuthorsFromList;
