import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { nip19 } from 'nostr-tools';
import { buildFilter } from '../components/nostrImageDownload';
import { topics } from '../data/topics';
import { followsAtom } from '../ngine/state';
import useAuthorsFromList from './useAuthorsFromList';
import { Settings } from './useNav';

/**
 * Custom hook to build Nostr filter based on current settings
 */
export default function useImageFilter(settings: Settings) {
  const listAuthors = useAuthorsFromList(settings.list);
  const [contacts] = useAtom(followsAtom);

  const filter = useMemo(() => {
    const authorsToQuery = settings.follows
      ? contacts?.tags.filter(t => t[0] === 'p').map(t => t[1]) || []
      : listAuthors && listAuthors.length > 0
        ? listAuthors
        : settings.npubs.map(p => nip19.decode(p).data as string);

    const filterTags = settings.topic ? topics[settings.topic].tags : settings.tags;

    return buildFilter(filterTags, authorsToQuery, settings.showReposts);
  }, [
    contacts?.tags,
    listAuthors,
    settings.follows,
    settings.npubs,
    settings.showReposts,
    settings.tags,
    settings.topic,
  ]);

  return filter;
}
