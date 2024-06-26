import './SlideShow.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NostrImage,
  buildFilter,
  extractImageUrls,
  isImage,
  isVideo,
  prepareContent,
  Post,
  isReply,
  isAdultRelated,
} from './nostrImageDownload';
import { adultContentTags, adultNPubs, blockedPublicKeys, mixedAdultNPubs, topics } from './env';
import Settings from './Settings';
import SlideView from './SlideView';
import { nip19 } from 'nostr-tools';
import uniqBy from 'lodash/uniqBy';
import AdultContentInfo from './AdultContentInfo';
import useNav, { ContentType } from '../utils/useNav';
import { useGlobalState } from '../utils/globalState';
import ScrollView from './ScrollView/ScrollView';
import IconPlay from './Icons/IconPlay';
import IconFullScreen from './Icons/IconFullScreen';
import useZapsAndReations from '../utils/useZapAndReaction';
import IconHeart from './Icons/IconHeart';
import IconBolt from './Icons/IconBolt';
import IconSearch from './Icons/IconSearch';
import useEvents from '../ngine/hooks/useEvents';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import MasonryView from './MasonryView/MasonryView';
import useAuthorsFromList from '../utils/useAuthorsFromList';
import GridView from './GridView';
import useWindowSize from '../utils/useWindowSize';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { followsAtom, useSession } from '../ngine/state';
import IconRepost from './Icons/IconRepost';
import useProfile from '../ngine/hooks/useProfile';
import IconBookmark from './Icons/IconBookmark';
import useBookMarks from '../utils/useBookMarks';

// type AlbyNostr = typeof window.nostr & { enabled: boolean };

/*
FEATURES:
- When one relay is not available the whole app stops working
- Login automatically / Save log in user
- the image grid div is updated constantly, why?
- Improve login (show login dialog, show login status)
- Detect if user/post does not have zap capability and show warning
- Retrieve reactions (likes, zaps) for all posts iteratively (pagination)
- Store posts separately from image urls to track likes/zaps per post
- improve mobile support
- widescreen mobile details view should be 2 columns
- improve large grid performance by adding images on scroll
- how to get back from a filtered user/tag to the full feed?
- always update title (grid and slideshow, maybe details too?)
- add respost/reply filter to the settings dialog
- Support re-posts and replies (incl. filter in settings)
- show tags 
- Suche der People Browser????
- Actions: Repost, Reply, Block, Mute, Follow, Unfollow, Add to Album
- preview for videos
- jump to note
- negative hashtag filter
- login to use your own feed
- login to use your your blocked/muted list
- Support people lists and note lists 
- flag/mute button?
- Add to album button? Favorite button?
- Prevent duplicates (shuffle?), prevent same author twice in a row
- show content warning?
- Support Deleted Events
- Prevent duplicate images (shuffle? history?)
*/

export type ViewMode = 'grid' | 'slideshow' | 'scroll';

const SlideShow = () => {
  const { width } = useWindowSize();
  const isMobile = useMemo(() => width && width <= 768, [width]);

  const [posts, setPosts] = useState<Post[]>([]);
  const images = useRef<NostrImage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSettings, setShowSettings] = useState(false);

  const { nav, currentSettings: settings } = useNav();
  const [state] = useGlobalState();
  const [imageIdx, setImageIdx] = useState<number | undefined>();

  const session = useSession();
  const profile = useProfile(session?.pubkey || ' ');
  const userNPub = session ? (nip19.npubEncode(session?.pubkey) as string) : undefined;
  const { bookmarkClick, bookmarkState } = useBookMarks(session?.pubkey, state.activeImage);

  const { zapClick, heartClick, zapState, heartState, repostClick, repostState } = useZapsAndReations(
    state.activeImage,
    userNPub
  );
  const navigate = useNavigate();
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

  const { events } = useEvents(filter, {
    cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
    // when seeing global, close stream because of too many updates.
    closeOnEose: settings.npubs.length == 0 && settings.tags.length == 0,
  });

  useEffect(() => {
    // console.log('set posts');
    setPosts(
      events
        .filter(
          event =>
            !blockedPublicKeys.includes(event.pubkey.toLowerCase()) && // remove blocked authors
            (settings.showReplies || !isReply(event)) &&
            (settings.showAdult || !isAdultRelated(event, settings.tags.length > 0))
        )
        .map(event => {
          // Hack: Write URL in the content for file events
          if (event.kind === 1063) {
            const urlTag = event?.tags?.find(t => t[0] == 'url');
            if (urlTag) {
              event.content = urlTag[1];
            }
          }

          // Convert reposts to the original event
          if (event.kind === 6 && event.content) {
            try {
              const repostedEvent = JSON.parse(event.content);
              if (repostedEvent) {
                event = repostedEvent;
                //event.isRepost = true;
              }
            } catch (e) {
              // ingore, the content is no valid json
            }
          }

          return { event };
        })
    );
  }, [events]);
  /*
  useEffect(() => {
    const fetch = () => {

      currentSubId.current = `${Math.floor(Math.random() * 10000000)}`;

      const postSubscription = ndk.subscribe(), {
        subId: currentSubId.current,
      });

      postSubscription.on('event', (event: NDKEvent) => {
        setPosts(oldPosts => {
          // Ignore event when the subscription's subId is not current any more.
          if (postSubscription.subId !== currentSubId.current) return oldPosts;

          //event.isReply = isReply(event);

          if (event.kind === 1063) {
            const urlTag = event?.tags?.find(t => t[0] == 'url');
            if (urlTag) {
              event.content = urlTag[1];
            }
          }

          if (event.kind === 6 && event.content) {
            try {
              const repostedEvent = JSON.parse(event.content);
              if (repostedEvent) {
                event = repostedEvent;
                //event.isRepost = true;
              }
            } catch (e) {
              // ingore, the content is no valid json
            }
          }

          if (
            !blockedPublicKeys.includes(event.pubkey.toLowerCase()) && // remove blocked authors
            (settings.showReplies || !isReply(event)) &&
            oldPosts.findIndex(p => p.event.id === event.id) === -1 && // not duplicate
            (settings.showAdult || !isAdultRelated(event, settings.tags.length > 0))
          ) {
            return [...oldPosts, { event }];
          }
          return oldPosts;
        });
      });

      postSubscription.on('notice', notice => {
        console.log('NOTICE: ', notice);
      });

      return () => {
        postSubscription.stop();
      };
    };

    if (ndk) {
      // reset all
      setPosts([]);
      images.current = [];

      clearTimeout(fetchTimeoutHandle.current);
      fetch();
    }
  }, [settings, ndk]);
*/

  useEffect(() => {
    // reset all
    setPosts([]);
    images.current = [];
  }, [settings]);

  useEffect(() => {
    images.current = uniqBy(
      posts
        .flatMap(p => {
          return extractImageUrls(p.event.content)
            .filter(url => isImage(url) || isVideo(url))
            .filter(url => !url.startsWith('https://creatr.nostr.wine/')) // Filter our creatr.nostr.wine content, since we don't have NIP-98 auth yet.
            .map(url => ({
              post: p,
              url,
              author: nip19.npubEncode(p.event.pubkey),
              authorId: p.event.pubkey,
              content: prepareContent(p.event.content),
              type: (isVideo(url) ? 'video' : 'image') as ContentType,
              timestamp: p.event.created_at,
              noteId: p.event.id || '',
              tags: p.event.tags?.filter((t: string[]) => t[0] === 't').map((t: string[]) => t[1].toLowerCase()) || [],
            }));
        })
        .filter(i => settings.type == 'all' || settings.type == i.type),
      'url'
    );
  }, [posts, settings.type]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (showSettings) return;
    if (event.key === 'Escape') {
      setViewMode('grid');
    }
    if (event.key.toLowerCase() === 'g') {
      setViewMode('grid');
    }
    if (event.key.toLowerCase() === 'h') {
      nav({ ...settings, npubs: [], list: undefined, topic: undefined, tags: [], follows: false });
    }
    if (event.key.toLowerCase() === 'x') {
      setViewMode('scroll');
    }
    if (event.key.toLowerCase() === 's') {
      setShowSettings(s => !s);
    }
    if (event.key === 'Escape') {
      setShowSettings(false);
    }
    /*
    if (event.key === "f" || event.key === "F") {
      document?.getElementById("root")?.requestFullscreen();
    }
    */
  };

  useEffect(() => {
    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  /*
  useEffect(() => {
    if (state.userNPub) {
      setState({ profile: getProfile(state.userNPub) });
    } else {
      setState({ profile: undefined });
    }
  }, [state.userNPub, getProfile, setState]);
*/
  const fullScreen = document.fullscreenElement !== null;

  const showAdultContentWarning =
    !settings.showAdult &&
    (adultContentTags.some(t => settings.tags.includes(t)) ||
      adultNPubs.some(p => settings.npubs.includes(p)) ||
      mixedAdultNPubs.some(p => settings.npubs.includes(p)));

  if (showAdultContentWarning) {
    return <AdultContentInfo></AdultContentInfo>;
  }

  return (
    <>
      {showSettings && <Settings onClose={() => setShowSettings(false)} setViewMode={setViewMode}></Settings>}
      <div className="top-left-controls">
        <a
          className="back-button"
          onClick={() => {
            if (viewMode == 'scroll' || viewMode == 'slideshow') {
              setViewMode('grid');
            } else {
              navigate(`/${settings.type !== 'all' ? `?type=${settings.type}` : ''}`);
            }
          }}
        >
          ✕
        </a>
      </div>

      {state.showNavButtons && (
        <div className="bottom-controls">
          {session?.pubkey && state.activeImage && (
            <>
              <button className={`bookmark ${bookmarkState ? 'bookmarked' : ''}`} onClick={() => bookmarkClick()}>
                <IconBookmark></IconBookmark>
              </button>
              <button
                className={`repost ${repostState ? 'reposted' : ''}`}
                onClick={() => !repostState && repostClick()}
              >
                <IconRepost></IconRepost>
              </button>
              <button
                className={`heart ${heartState}`}
                onClick={() => state.activeImage && heartClick(state.activeImage)}
              >
                <IconHeart></IconHeart>
              </button>
              {(profile?.lud06 || profile?.lud16) && (
                <button className={`zap ${zapState}`} onClick={() => state.activeImage && zapClick(state.activeImage)}>
                  <IconBolt></IconBolt>
                </button>
              )}
            </>
          )}

          {viewMode == 'grid' && !isMobile && (
            <button
              onClick={e => {
                e.stopPropagation();
                setViewMode('slideshow');
                return true;
              }}
              title={'play slideshow (G)'}
            >
              <IconPlay />
            </button>
          )}

          {viewMode != 'slideshow' && (
            <button onClick={() => setShowSettings(s => !s)}>
              <IconSearch />
            </button>
          )}

          {viewMode == 'slideshow' && !fullScreen && (
            <button onClick={() => document?.getElementById('root')?.requestFullscreen()}>
              <IconFullScreen />
            </button>
          )}
        </div>
      )}

      {viewMode == 'grid' &&
        (isMobile ? (
          <GridView
            images={images.current}
            settings={settings}
            setCurrentImage={setImageIdx}
            currentImage={imageIdx}
            setViewMode={setViewMode}
          ></GridView>
        ) : (
          <MasonryView
            images={images.current}
            settings={settings}
            setCurrentImage={setImageIdx}
            currentImage={imageIdx}
            setViewMode={setViewMode}
          ></MasonryView>
        ))}
      {viewMode == 'scroll' && (
        <ScrollView
          images={images.current}
          settings={settings}
          setCurrentImage={setImageIdx}
          currentImage={imageIdx}
          setViewMode={setViewMode}
        ></ScrollView>
      )}
      {viewMode == 'slideshow' && <SlideView images={images} settings={settings} setViewMode={setViewMode}></SlideView>}
    </>
  );
};

export default SlideShow;
