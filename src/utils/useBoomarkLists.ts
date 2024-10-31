import { useMemo } from 'react';
import useEvents from '../ngine/hooks/useEvents';

const KIND_BOOKMARK_LISTS = 30003;

const useBookmarkLists = (pubkey?: string) => {
  const { events } = useEvents(
    { kinds: [KIND_BOOKMARK_LISTS], authors: pubkey ? [pubkey] : [], limit: 50 },
    { disable: !pubkey }
  );

  const bookmarkLists = useMemo(() => {
    const eventsWithName = events.filter(e => e.tags.some(t => t[0] === 'd'));

    return eventsWithName.map(e => {
      const nameTag = e.getMatchingTags('d').slice(0, 1).flat();
      const titleTag = e.getMatchingTags('title').slice(0, 1).flat();
      const descriptionTag = e.getMatchingTags('description').slice(0, 1).flat();

      const name = titleTag.length > 0 ? titleTag[1] : nameTag ? nameTag[1] : 'unknown';
      const description = descriptionTag.length > 0 && descriptionTag[1];
      const events = e.tags.filter(t => t[0] === 'e')?.map(t => t[1]);
      const urls = e.tags.filter(t => t[0] === 'r')?.map(t => t[1]);

      return { id: e.id, nevent: e.encode(), name, events, urls, description };
    });
  }, [events]);

  const filteredPeopleLists = useMemo(
    () =>
      bookmarkLists.filter(
        l =>
          l.name !== 'unknown' &&
          l.events.length > 0 &&
          l.name.toLocaleLowerCase().indexOf('mute') == -1 &&
          l.name.toLocaleLowerCase().indexOf('allow')
      ),
    [bookmarkLists]
  );

  return filteredPeopleLists;
};

export default useBookmarkLists;
