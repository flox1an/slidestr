import { useMemo } from 'react';
import useEvents from '../ngine/hooks/useEvents';

const KIND_PEOPLE_LIST = 30000;

const usePeopleLists = (pubkey?: string) => {
  const { events } = useEvents(
    { kinds: [KIND_PEOPLE_LIST], authors: pubkey ? [pubkey] : [], limit: 50 },
    { disable: !pubkey }
  );

  const peopleLists = useMemo(() => {
    const eventsWithName = events.filter(e => e.tags.some(t => t[0] === 'd'));

    return eventsWithName.map(e => {
      const nameTag = e.getMatchingTags('d').slice(0, 1).flat();
      const titleTag = e.getMatchingTags('title').slice(0, 1).flat();
      const descriptionTag = e.getMatchingTags('description').slice(0, 1).flat();

      const name = titleTag.length > 0 ? titleTag[1] : nameTag ? nameTag[1] : 'unknown';
      const description = descriptionTag.length > 0 && descriptionTag[1];
      const people = e.tags.filter(t => t[0] === 'p')?.map(t => t[1]);

      return { id: e.id, nevent: e.encode(), name, people, description };
    });
  }, [events]);

  const filteredPeopleLists = useMemo(
    () =>
      peopleLists.filter(
        l =>
          l.name !== 'unknown' &&
          l.people.length > 0 &&
          l.name.toLocaleLowerCase().indexOf('mute') == -1 &&
          l.name.toLocaleLowerCase().indexOf('allow')
      ),
    [peopleLists]
  );

  return filteredPeopleLists;
};

export default usePeopleLists;
