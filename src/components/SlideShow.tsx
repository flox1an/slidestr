import { useNDK } from "@nostr-dev-kit/ndk-react";
import "./SlideShow.css";
import React, { useEffect, useRef, useState } from "react";
import {
  NostrImage,
  buildFilter,
  extractImageUrls,
  hasContentWarning,
  hasNsfwTag,
  isReply,
  prepareContent,
} from "./nostrImageDownload";
import { nfswTags, nsfwNPubs, nsfwPubKeys } from "./env";
import Settings from "./Settings";
import SlideView from "./SlideView";
import GridView from "./GridView";
import { nip19 } from "nostr-tools";
import IconFullScreen from "./IconFullScreen";
import { uniqBy } from "lodash";
import AdultContentInfo from "./AdultContentInfo";

/*
FEATURES:
- dedupe urls
- controls lighter
- info for nsfw acc / tags
- preview for videos
- details view for the grid


--------
- show tags 
- show content text (how to beautify?, crop?)
- jump to note
- negative hashtag filter
- login to use your own feed
- login to use your your blocked/muted list
- Keypoard shortcuts, arrow, spacebar
- jump tu next image
- jump to previous image????
- pause?
- Save-Mode and block NSFW content??
- Block certain authors / npbs? Maybe trust lookup @ nostr.band?
- Add warning start page with localStorge to remember
- Add config/settigns dialog
- Support people lists and note lists 
- flag/mute button?
- Add to album button? Favorite button?
- Prevent duplicates (shuffle?), prevent same author twice in a row
- show content warning?
- Support Deleted Events
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

    const postSubscription = ndk.subscribe(
      buildFilter(settings.tags, settings.npubs)
    );

    postSubscription.on("event", (event) => {
      eventsReceived++;

      setPosts((oldPosts) => {
        if (
          !isReply(event) &&
          oldPosts.findIndex((p) => p.id === event.id) === -1 &&
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

    postSubscription.on("notice", (notice) => {
      console.log("NOTICE: ", notice);
    });

    return () => {
      postSubscription.stop();
    };
  };

  useEffect(() => {
    loadNdk([
      "wss://relay.damus.io",
      "wss://relay.nostr.band",
      "wss://nos.lol",
      "wss://relay.mostr.pub",
      "wss://relay.shitforce.one/",

      //"wss://nostr.wine",
      // "wss://nostr1.current.fyi/",
      "wss://purplepag.es/", // needed for user profiles
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
      posts.flatMap((p) => {
        return extractImageUrls(p.content)
          .filter(
            (url) =>
              url.endsWith(".jpg") ||
              url.endsWith(".png") ||
              url.endsWith(".gif") ||
              url.endsWith(".jpeg") ||
              url.endsWith(".webp") ||
              url.endsWith(".webm") ||
              url.endsWith(".mp4")
          )
          .map((url) => ({
            url,
            author: p.author.npub,
            content: prepareContent(p.content),
            type:
              url.endsWith(".mp4") || url.endsWith(".webm") ? "video" : "image",
            timestamp: p.created_at,
            noteId: nip19.noteEncode(p.id),
            tags: p.tags
              .filter((t: string[]) => t[0] === "t")
              .map((t: string[]) => t[1].toLowerCase()),
          }));
      }),
      "url"
    );
    console.log(images.current.length);
  }, [posts]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (showSettings) return;

    if (event.key === "g" || event.key === "G") {
      setShowGrid((p) => !p);
    }
    if (event.key === "Escape") {
      setShowSettings((s) => !s);
    }
    /*
    if (event.key === "f" || event.key === "F") {
      document?.getElementById("root")?.requestFullscreen();
    }
    */
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const fullScreen = document.fullscreenElement !== null;

  const showAdultContentWarning =
    !settings.showNsfw && (
    nfswTags.some((t) => settings.tags.includes(t)) ||
    nsfwNPubs.some((p) => settings.npubs.includes(p)));

  if (showAdultContentWarning) {
    return <AdultContentInfo></AdultContentInfo>;
  }

  return (
    <>
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          settings={settings}
        ></Settings>
      )}

      <div className="controls">
        <button
          onClick={() => setShowGrid((g) => !g)}
          title={showGrid ? "Play random slideshow (G)" : "view grid (G)"}
        >
          {showGrid ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="1em"
              viewBox="0 0 384 512"
            >
              <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="1em"
              viewBox="0 0 448 512"
            >
              <path d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40H40c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40H200c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40H360c-22.1 0-40 17.9-40 40v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328z" />
            </svg>
          )}
        </button>

        <button onClick={() => setShowSettings((s) => !s)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 512 512"
          >
            <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
          </svg>
        </button>

        {!fullScreen && (
          <button
            onClick={() =>
              document?.getElementById("root")?.requestFullscreen()
            }
          >
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
