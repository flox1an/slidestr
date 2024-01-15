import { useNDK } from '@nostr-dev-kit/ndk-react';
import './SlideShow.css';
import React, { useEffect, useRef, useState } from 'react';
import {
  NostrImage,
  buildFilter,
  extractImageUrls,
  isImage,
  isAdultRelated,
  isReply,
  isVideo,
  prepareContent,
  Post,
  createImgProxyUrl,
} from './nostrImageDownload';
import { blockedPublicKeys, adultContentTags, adultNPubs, mixedAdultNPubs } from './env';
import Settings from './Settings';
import SlideView from './SlideView';
import { nip19 } from 'nostr-tools';
import uniqBy from 'lodash/uniqBy';
import AdultContentInfo from './AdultContentInfo';
import IconSettings from './Icons/IconSettings';
import useNav from '../utils/useNav';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useGlobalState } from '../utils/globalState';
import useAutoLogin from '../utils/useAutoLogin';
import IconUser from './Icons/IconUser';
import ScrollView from './GridView/ScrollView';
import IconPlay from './Icons/IconPlay';
import IconGrid from './Icons/IconGrid';
import IconFullScreen from './Icons/IconFullScreen';
import GridView from './GridView';

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
  const { ndk, loginWithNip07, getProfile } = useNDK();
  const [posts, setPosts] = useState<Post[]>([]);
  const images = useRef<NostrImage[]>([]);
  const fetchTimeoutHandle = useRef(0);
  const [viewMode, setViewMode] = useState<ViewMode>('scroll');
  const [showSettings, setShowSettings] = useState(false);
  const { currentSettings: settings } = useNav();
  const [state, setState] = useGlobalState();
  const { autoLogin, setAutoLogin } = useAutoLogin();
  const currentSubId = useRef('1');
  const [currentImage, setCurrentImage] = useState<number | undefined>();

  useEffect(() => {
    const fetch = () => {
      if (!ndk) {
        console.error('NDK not available.');
        return;
      }

      currentSubId.current = `${Math.floor(Math.random() * 10000000)}`;

      const postSubscription = ndk.subscribe(buildFilter(settings.tags, settings.npubs, settings.showReposts), {
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
    if (event.key.toLowerCase() === 'g') {
      setViewMode('grid');
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
    setTimeout(() => {
      if (autoLogin && window.nostr) {
        // auto login when alby is available
        onLogin();
      }
    }, 100);

    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const fullScreen = document.fullscreenElement !== null;

  const showAdultContentWarning =
    !settings.showAdult &&
    (adultContentTags.some(t => settings.tags.includes(t)) ||
      adultNPubs.some(p => settings.npubs.includes(p)) ||
      mixedAdultNPubs.some(p => settings.npubs.includes(p)));

  if (showAdultContentWarning) {
    return <AdultContentInfo></AdultContentInfo>;
  }

  const onLogin = async () => {
    setAutoLogin(true);
    const result = await loginWithNip07();
    if (!result) {
      console.error('Login failed.');
      return;
    }

    setState({ userNPub: result.npub });
    console.log(result.npub);
  };

  const onLogout = () => {
    setAutoLogin(false);
    setState({ userNPub: undefined, profile: undefined });
  };

  const currentUserProfile = state.userNPub && getProfile(state.userNPub);

  const toggleViewMode = () => {
    setViewMode(view => (view == 'grid' ? 'scroll' : 'grid'));
  };

  return (
    <>
      {showSettings && <Settings onClose={() => setShowSettings(false)}></Settings>}

      <div className="top-controls">
        {state.userNPub && currentUserProfile ? (
          currentUserProfile.image && (
            <img className="profile" onClick={onLogout} src={createImgProxyUrl(currentUserProfile.image, 80, 80)} />
          )
        ) : (
          <button onClick={onLogin} className="login">
            <IconUser></IconUser>
          </button>
        )}
      </div>

      {state.showNavButtons && (
        <div className="bottom-controls">
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
              <IconSettings />
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
        <GridView
          images={images.current}
          settings={settings}
          setCurrentImage={setCurrentImage}
          currentImage={currentImage}
          setViewMode={setViewMode}
        ></GridView>
      )}
      {viewMode == 'scroll' && (
        <ScrollView
          images={images.current}
          settings={settings}
          setCurrentImage={setCurrentImage}
          currentImage={currentImage}
        ></ScrollView>
      )}
      {viewMode == 'slideshow' && <SlideView images={images} settings={settings} setViewMode={setViewMode}></SlideView>}
    </>
  );
};

export default SlideShow;
