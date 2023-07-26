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
import { nsfwPubKeys } from "./env";
import Settings from "./Settings";
import SlideView from "./SlideView";
import GridView from "./GridView";

/*
FEATURES:
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
    images.current = posts.flatMap((p) => {
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
          tags: p.tags
            .filter((t: string[]) => t[0] === "t")
            .map((t: string[]) => t[1].toLowerCase()),
        }));
    });
    console.log(images.current.length);
  }, [posts]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "g" || event.key === "G") {
      setShowGrid((p) => !p);
    }
  };

  useEffect(() => {
    document.body.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return showGrid ? (
    <GridView images={images.current} settings={settings}></GridView>
  ) : (
    <SlideView images={images.current} settings={settings}></SlideView>
  );
};

export default SlideShow;
