import { useNDK } from '@nostr-dev-kit/ndk-react';
import './SlideShow.css';
import React, { useEffect, useRef, useState } from 'react';
import {
  NostrImage,
  buildFilter,
  extractImageUrls,
  hasContentWarning,
  hasNsfwTag,
  isImage,
  isReply,
  isVideo,
  prepareContent,
} from './nostrImageDownload';
import { nfswTags, nsfwNPubs, nsfwPubKeys } from './env';
import Settings from './Settings';
import SlideView from './SlideView';
import GridView from './GridView';
import { nip19 } from 'nostr-tools';
import IconFullScreen from './Icons/IconFullScreen';
import uniqBy from 'lodash/uniqBy';
import AdultContentInfo from './AdultContentInfo';
import IconSettings from './Icons/IconSettings';
import IconPlay from './Icons/IconPlay';
import IconGrid from './Icons/IconGrid';

/*
FEATURES:
- why do we always start with the same image?
- details view for the grid
- show content text (how to beautify?, crop?)
- show tags 
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
- Support reposts and replies (incl. filter in settings)
- Prevent duplicate images (shuffle? histroy?)
*/

// let oldest = Infinity;
let maxFetchCount = 1;
let eventsReceived = 0;

const SlideShow = (settings: Settings) => {
  const { ndk, loadNdk } = useNDK();
  const [posts, setPosts] = useState<any[]>([]);
  const images = useRef<NostrImage[]>([]);
  const fetchTimeoutHandle = useRef(0);
  const [showGrid, setShowGrid] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetch = () => {
    eventsReceived = 0;

    const postSubscription = ndk.subscribe(buildFilter(settings.tags, settings.npubs));

    postSubscription.on('event', event => {
      eventsReceived++;

      setPosts(oldPosts => {
        if (
          !isReply(event) &&
          oldPosts.findIndex(p => p.id === event.id) === -1 &&
          (settings.showNsfw ||
            (!hasContentWarning(event) && // only allow content warnings on profile content
              !hasNsfwTag(event) && // only allow nsfw on profile content
              !nsfwPubKeys.includes(event.pubkey.toLowerCase()))) // block nsfw authors
        ) {
          return [...oldPosts, event];
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

  useEffect(() => {
    loadNdk([
      'wss://relay.damus.io',
      'wss://relay.nostr.band',
      'wss://nos.lol',
      'wss://relay.mostr.pub',
      'wss://relay.shitforce.one/',

      //"wss://nostr.wine",
      // "wss://nostr1.current.fyi/",
      'wss://purplepag.es/', // needed for user profiles
      //"wss://feeds.nostr.band/pics",
    ]);
  }, []);

  useEffect(() => {
    // reset all
    console.log(`resetting`);
    setPosts([]);
    maxFetchCount = 20;
    eventsReceived = 0;
    images.current = [];
    clearTimeout(fetchTimeoutHandle.current);

    return fetch();
  }, [settings]);

  useEffect(() => {
    images.current = uniqBy(
      posts.flatMap(p => {
        return extractImageUrls(p.content)
          .filter(url => isImage(url) || isVideo(url))
          .map(url => ({
            url,
            author: p.author.npub,
            content: prepareContent(p.content),
            type: isVideo(url) ? 'video' : 'image',
            timestamp: p.created_at,
            noteId: nip19.noteEncode(p.id),
            tags: p.tags.filter((t: string[]) => t[0] === 't').map((t: string[]) => t[1].toLowerCase()),
          }));
      }),
      'url'
    );
    console.log(images.current.length);
  }, [posts]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (showSettings) return;

    if (event.key === 'g' || event.key === 'G') {
      setShowGrid(p => !p);
    }
    if (event.key === 'Escape') {
      setShowSettings(s => !s);
    }
    /*
    if (event.key === "f" || event.key === "F") {
      document?.getElementById("root")?.requestFullscreen();
    }
    */
  };

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const fullScreen = document.fullscreenElement !== null;

  const showAdultContentWarning =
    !settings.showNsfw &&
    (nfswTags.some(t => settings.tags.includes(t)) || nsfwNPubs.some(p => settings.npubs.includes(p)));

  if (showAdultContentWarning) {
    return <AdultContentInfo></AdultContentInfo>;
  }

  return (
    <>
      {showSettings && <Settings onClose={() => setShowSettings(false)} settings={settings}></Settings>}

      <div className="controls">
        <button onClick={() => setShowGrid(g => !g)} title={showGrid ? 'Play random slideshow (G)' : 'view grid (G)'}>
          {showGrid ? <IconPlay /> : <IconGrid />}
        </button>

        <button onClick={() => setShowSettings(s => !s)}>
          <IconSettings />
        </button>

        {!fullScreen && (
          <button onClick={() => document?.getElementById('root')?.requestFullscreen()}>
            <IconFullScreen />
          </button>
        )}
      </div>

      {showGrid ? (
        <GridView images={images.current} settings={settings}></GridView>
      ) : (
        <SlideView images={images.current} settings={settings}></SlideView>
      )}
    </>
  );
};

export default SlideShow;
