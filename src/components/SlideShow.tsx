import './SlideShow.css';
import React, { useEffect, useRef, useState } from 'react';
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
import { adultContentTags, adultNPubs, blockedPublicKeys, mixedAdultNPubs } from './env';
import Settings from './Settings';
import SlideView from './SlideView';
import { nip19 } from 'nostr-tools';
import uniqBy from 'lodash/uniqBy';
import AdultContentInfo from './AdultContentInfo';
import useNav from '../utils/useNav';
import { useGlobalState } from '../utils/globalState';
import ScrollView from './ScrollView/ScrollView';
import IconPlay from './Icons/IconPlay';
import IconGrid from './Icons/IconGrid';
import IconFullScreen from './Icons/IconFullScreen';
import useZapsAndReations from '../utils/useZapAndReaction';
import IconHeart from './Icons/IconHeart';
import IconBolt from './Icons/IconBolt';
import IconSearch from './Icons/IconSearch';
import useEvents from '../ngine/hooks/useEvents';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import MasonryView from './MasonryView/MasonryView';
import useAuthorsFromList from '../utils/useAuthorsFromList';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const images = useRef<NostrImage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSettings, setShowSettings] = useState(false);

  const { nav, currentSettings: settings } = useNav();
  const [state] = useGlobalState();
  const [imageIdx, setImageIdx] = useState<number | undefined>();
  const { zapClick, heartClick, zapState, heartState } = useZapsAndReations(state.activeImage, state.userNPub);

  const listAuthors = useAuthorsFromList(settings.list);
  const authorsToQuery = listAuthors ? listAuthors : settings.npubs.map(p => nip19.decode(p).data as string);
  //const authorsToQuery = settings.npubs.map(p => nip19.decode(p).data as string);
  const { events } = useEvents(buildFilter(settings.tags, authorsToQuery, settings.showReposts), {
    cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
  });

  useEffect(() => {
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
      posts.flatMap(p => {
        return extractImageUrls(p.event.content)
          .filter(url => isImage(url) || isVideo(url))
          .filter(url => !url.startsWith('https://creatr.nostr.wine/')) // Filter our creatr.nostr.wine content, since we don't have NIP-98 auth yet.
          .map(url => ({
            post: p,
            url,
            author: nip19.npubEncode(p.event.pubkey),
            authorId: p.event.pubkey,
            content: prepareContent(p.event.content),
            type: isVideo(url) ? 'video' : 'image',
            timestamp: p.event.created_at,
            noteId: p.event.id || '',
            tags: p.event.tags?.filter((t: string[]) => t[0] === 't').map((t: string[]) => t[1].toLowerCase()) || [],
          }));
      }),
      'url'
    );
  }, [posts]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (showSettings) return;
    if (event.key === 'Escape') {
      setViewMode('grid');
    }
    if (event.key.toLowerCase() === 'g') {
      setViewMode('grid');
    }
    if (event.key.toLowerCase() === 'h') {
      nav({ ...settings, npubs: [], tags: [] });
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

  const toggleViewMode = () => {
    setViewMode(view => (view == 'grid' ? 'scroll' : 'grid'));
  };

  return (
    <>
      {showSettings && <Settings onClose={() => setShowSettings(false)} setViewMode={setViewMode}></Settings>}

      {state.showNavButtons && (
        <div className="bottom-controls">
          {state.userNPub && state.activeImage && (
            <>
              <button
                className={`heart ${heartState}`}
                onClick={() => state.activeImage && heartClick(state.activeImage)}
              >
                <IconHeart></IconHeart>
              </button>
              {(state.profile?.lud06 || state.profile?.lud16) && (
                <button className={`zap ${zapState}`} onClick={() => state.activeImage && zapClick(state.activeImage)}>
                  <IconBolt></IconBolt>
                </button>
              )}
            </>
          )}

          {(viewMode == 'scroll' || viewMode == 'slideshow') && (
            <button onClick={() => toggleViewMode()} title={'view grid (G)'}>
              <IconGrid />
            </button>
          )}
          {viewMode == 'grid' && (
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

      {viewMode == 'grid' && (
        <MasonryView
          images={images.current}
          settings={settings}
          setCurrentImage={setImageIdx}
          currentImage={imageIdx}
          setViewMode={setViewMode}
        ></MasonryView>
      )}
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
