import { useMemo } from 'react';
import { useNDK } from '../../ngine/context';
import useEvents from '../../ngine/hooks/useEvents';
import { NDKKind, profileFromEvent } from '@nostr-dev-kit/ndk';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import { createImgProxyUrl, urlFix } from '../nostrImageDownload';
import { nip19 } from 'nostr-tools';
import { ViewMode } from '../SlideShow';
import './SearchResults.css';
import { defaultHashTags, hashtags, publicUrl, topics, visibleHashTags } from '../env';
import useNav from '../../utils/useNav';
import usePeopleLists from '../../utils/useLists';
import { useSession } from '../../ngine/state';
import IconList from '../Icons/IconList';

type SearchResultsProps = {
  searchText?: string;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchText: React.Dispatch<React.SetStateAction<string | undefined>>;
};

function SearchResults({ searchText, setSearchText, setViewMode }: SearchResultsProps) {
  const ndk = useNDK();
  const session = useSession();
  const lists = usePeopleLists(session?.pubkey);
  const { nav, currentSettings } = useNav();

  const lowerSearchText = searchText?.toLowerCase();

  const profileResult = useEvents(
    { kinds: [NDKKind.Metadata], search: lowerSearchText, limit: 20 },
    { closeOnEose: true, disable: searchText == undefined || searchText?.length < 3 },
    ['wss://relay.nostr.band']
  );
  const showAdult = currentSettings.showAdult || false;

  const profiles = useMemo(() => {
    return profileResult.events.map(e => ({ npub: nip19.npubEncode(e.pubkey), profile: profileFromEvent(e) }));
  }, [profileResult.events]);

  const allTopics = useMemo(
    () =>
      Object.entries(topics)
        .map(t => ({ key: t[0], ...t[1] }))
        .filter(t => !t.nsfw || showAdult),
    [topics, showAdult]
  );

  const hashtagResult = useMemo(() => {
    if (lowerSearchText) {
      return hashtags.filter(t => t.indexOf(lowerSearchText) >= 0);
    } else {
      return [];
    }
  }, [hashtags, searchText]);

  const topicResult = useMemo(() => {
    return lowerSearchText == undefined
      ? allTopics
      : allTopics.filter(
          t =>
            (t.name && t.name.toLowerCase().indexOf(lowerSearchText) >= 0) ||
            (t.description && t.description.toLowerCase().indexOf(lowerSearchText) >= 0) ||
            t.tags.some(tag => tag.indexOf(lowerSearchText) >= 0)
        );
  }, [allTopics, searchText]);

  const yourListsResult = useMemo(() => {
    return lowerSearchText == undefined
      ? lists
      : lists.filter(
          t =>
            (t.name && t.name.toLowerCase().indexOf(lowerSearchText) >= 0) ||
            (t.description && t.description.toLowerCase().indexOf(lowerSearchText) >= 0)
        );
  }, [lists, searchText]);

  return (
    <div className="search-results">
      {topicResult.length > 0 && (
        <div style={{ minWidth: '300px' }}>
          <h2>Topics</h2>
          <div className="topic-list">
            {topicResult.map(t => (
              <div
                key={t.key}
                className="topic"
                style={{
                  backgroundImage: `linear-gradient(170deg, rgba(0, 0, 0, .8) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%), url(${createImgProxyUrl(publicUrl + '/images/' + t.key + '.jpg', 600, -1)})`,
                }}
                onClick={() => {
                  setSearchText(undefined);
                  nav({ ...currentSettings, topic: t.key, npubs: [], tags: [], list: undefined, follows: false });
                }}
              >
                <div className="topic-title">{t.name || t.key}</div>
                {t.description && <div>{t.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ minWidth: '300px' }}>
        <h2>{hashtagResult.length > 0 ? 'Hashtags' : 'Popular Hashtags'}</h2>
        <div className="tag-list">
          {(hashtagResult.length > 0 ? hashtagResult : visibleHashTags).map(t => (
            <div
              key={t}
              className="tag"
              onClick={() => {
                setSearchText(undefined);
                nav({ ...currentSettings, topic: undefined, npubs: [], tags: [t], list: undefined, follows: false });
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {profiles.length > 0 && (
        <div style={{ minWidth: '300px' }}>
          <h2>People</h2>
          <div className="people-list">
            {profiles.map(r => (
              <AuthorProfile
                key={r.npub}
                src={urlFix(r.profile.image || '')}
                author={r.profile.displayName || r.profile.name}
                nip5={r.profile.nip5 ? '' + r.profile.nip5 : undefined}
                npub={r.npub}
                setViewMode={setViewMode}
                onBeforeNavigate={() => setSearchText(undefined)}
              ></AuthorProfile>
            ))}
          </div>
        </div>
      )}

      {yourListsResult && yourListsResult.length > 0 && (
        <div style={{ minWidth: '300px' }}>
          <h2>Your lists</h2>
          <div className="topic-list">
            <div
              className="topic"
              style={{}}
              onClick={() => {
                setSearchText(undefined);

                nav({
                  ...currentSettings,
                  topic: undefined,
                  npubs: [],
                  tags: [],
                  list: undefined,
                  follows: true,
                  showReplies: false,
                  showReposts: true,
                  showAdult,
                });
              }}
            >
              <div className="topic-title">
                <IconList /> Your follows
              </div>
            </div>
            {yourListsResult.map(l => (
              <div
                key={l.nevent}
                className="topic"
                style={{}}
                onClick={() => {
                  setSearchText(undefined);

                  nav({
                    ...currentSettings,
                    tags: [],
                    npubs: [],
                    list: l.nevent,
                    topic: undefined,
                    follows: false,
                    showAdult,
                  });
                }}
              >
                <div className="topic-title">
                  <IconList /> {l.name}
                </div>
                {l.description && <div>{l.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
