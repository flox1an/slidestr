import { useNDK } from "@nostr-dev-kit/ndk-react";
import "./SlideShow.css";
import React, { useEffect, useRef, useState } from "react";
import AuthorProfile from "./AuthorProfile";
import IconFullScreen from "./IconFullScreen";
import Slide from "./Slide";
import { Helmet } from "react-helmet";
import useDebouncedEffect from "../utils/useDebouncedEffect";
import {
  NostrImage,
  buildFilter,
  extractImageUrls,
  hasContentWarning,
  hasNsfwTag,
  isReply,
  prepareContent,
  urlFix,
} from "./nostrImageDownload";
import { appName, nsfwPubKeys } from "./env";
import Settings from "./Settings";
import { useSwipeable } from "react-swipeable";

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
  const { ndk, getProfile, loadNdk } = useNDK();
  const [posts, setPosts] = useState<any[]>([]);
  const images = useRef<NostrImage[]>([]);
  const [activeImages, setActiveImages] = useState<NostrImage[]>([]);
  const history = useRef<NostrImage[]>([]);

  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const upcommingImage = useRef<NostrImage>();
  const [title, setTitle] = useState(appName);
  const [loading, setLoading] = useState(true);
  const [activeNpub, setActiveNpub] = useState<string | undefined>(undefined);
  const [slideShowStarted, setSlideShowStarted] = useState(false);
  const [activeContent, setActiveContent] = useState<string | undefined>(
    undefined
  );
  const viewTimeoutHandle = useRef(0);
  const fetchTimeoutHandle = useRef(0);

  const queueNextImage = (waitTime = 8000) => {
    clearTimeout(viewTimeoutHandle.current);
    viewTimeoutHandle.current = setTimeout(() => {
      if (!paused) {
        setLoading(false);
        animateImages();
        queueNextImage();
      }
    }, waitTime);
  };

  const nextImage = () => {
    setPaused(false);
    setActiveImages([]);
    queueNextImage(0);
  };

  const previousImage = () => {
    setPaused(false);

    console.log(history);
    if (history.current.length > 1) {
      const previousImage = history.current.pop(); // remove current image
      previousImage && images.current.push(previousImage); // add current image back to the pool
      const lastImage = history.current[history.current.length - 1]; // show preview image but leave in the history
      if (lastImage) {
        setActiveImages([lastImage]);
        upcommingImage.current = lastImage;
        queueNextImage(); // queue next image for 8s after showing this one
      }
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextImage(),
    onSwipedRight: () => previousImage(),
  });

  const fetch = () => {
    //const until = oldest < Infinity ? oldest : undefined;
    //const untilPerRelay: { [n: string]: number } = {};
    eventsReceived = 0;
    //console.log(`starting fetch with until ${until}`);

    const postSubscription = ndk.subscribe(
      buildFilter(setTitle, settings.tags, settings.npubs)
    );

    postSubscription.on("event", (event) => {
      eventsReceived++;
      /*
      if (
        untilPerRelay[event.relay.url] === undefined ||
        event.created_at < untilPerRelay[event.relay.url]
      ) {
        untilPerRelay[event.relay.url] = event.created_at;
      }
      */
      setPosts((oldPosts) => {
        /*
        console.log(oldPosts.length);
        console.log(`received event ${event.id} ${event.created_at}`);
        console.log(`isReply ${isReply(event)}`);
        console.log(`showNsfw ${showNsfw} hasContentWarning ${hasContentWarning(event)} hasNsfwTag ${hasNsfwTag(event)} nsfwPubKeys ${nsfwPubKeys.includes(event.pubkey.toLowerCase())}`);
        */
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
    /*
    if (maxFetchCount > 0) {
      maxFetchCount--;
      clearTimeout(fetchTimeoutHandle.current);
      fetchTimeoutHandle.current = setTimeout(() => {
        console.log(JSON.stringify(untilPerRelay));
        console.log(`eventsReceived ${eventsReceived}`);

        oldest = Math.max(...Object.values(untilPerRelay));
        if (eventsReceived > 0) fetch();
      }, 3000);
    }
    */
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
    setPaused(false);
    setSlideShowStarted(false);
    maxFetchCount = 20;
    eventsReceived = 0;
    setActiveImages([]);
    history.current = [];
    images.current = [];
    upcommingImage.current = undefined;
    clearTimeout(fetchTimeoutHandle.current);
    clearTimeout(viewTimeoutHandle.current);

    return fetch();
  }, [settings]);

  const animateImages = () => {
    console.log(`animateImages`);

    setActiveImages((oldImages) => {
      const newActiveImages = [...oldImages];
      if (newActiveImages.length > 2) {
        // always keep 2 images
        newActiveImages.shift();
      }
      if (images.current.length > 0) {
        const randomImage =
          images.current[Math.floor(Math.random() * images.current.length)];

        // TODO this creates potential duplicates when images are loaded from multiple relays
        images.current = images.current.filter((i) => i !== randomImage);

        history.current.push(randomImage);
        newActiveImages.push(randomImage);
        upcommingImage.current = randomImage;
      }
      return newActiveImages;
    });
  };

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
          tags: p.tags
            .filter((t: string[]) => t[0] === "t")
            .map((t: string[]) => t[1].toLowerCase()),
        }));
    });
    console.log(images.current.length);

    // Make sure we have an image to start with but only trigger once
    if (!slideShowStarted && images.current.length > 2) {
      setSlideShowStarted(true);
      queueNextImage(500);
    }
  }, [posts]);

  const onKeyDown = (event: KeyboardEvent) => {
    // console.log(event);
    if (event.key === "ArrowRight") {
      nextImage();
    }
    if (event.key === "ArrowLeft") {
      previousImage();
    }
    if (event.key === "p" || event.key === " " || event.key === "P") {
      setPaused((p) => !p);
    }
    if (event.key === "Escape") {
      setShowSettings((s) => !s);
    }
  };

  useEffect(() => {
    console.log(history);
  }, [history]);

  useEffect(() => {
    document.body.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const fullScreen = document.fullscreenElement !== null;

  useDebouncedEffect(
    () => {
      setActiveNpub(upcommingImage?.current?.author);
      setActiveContent(upcommingImage?.current?.content);
    },
    [upcommingImage?.current],
    2000
  );

  const activeProfile = activeNpub && getProfile(activeNpub);

  useEffect(() => {
    if (
      settings.npubs &&
      activeProfile &&
      (activeProfile.displayName || activeProfile.name)
    ) {
      setTitle(
        activeProfile.displayName || activeProfile.name + ` | ${appName}`
      );
    }
  }, [activeProfile]);

  return (
    <div
      {...swipeHandlers}
      onClick={() => setPaused((p) => !p)}
      style={{ overflow: "hidden" }}
    >
      <Helmet>
        <title>{title}</title>
      </Helmet>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          settings={settings}
        ></Settings>
      )}

      {!fullScreen && (
        <div className="controls">
          <button onClick={() => setShowSettings(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="1em"
              viewBox="0 0 512 512"
            >
              <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
            </svg>
          </button>
          <button
            onClick={() =>
              document?.getElementById("root")?.requestFullscreen()
            }
          >
            <IconFullScreen />
          </button>
        </div>
      )}

      {paused && (
        <div className="centerSymbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 320 512"
          >
            <path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z" />
          </svg>
        </div>
      )}

      {loading && (
        <div className="centerSymbol spin">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 512 512"
          >
            <path d="M256 96c38.4 0 73.7 13.5 101.3 36.1l-32.6 32.6c-4.6 4.6-5.9 11.5-3.5 17.4s8.3 9.9 14.8 9.9H448c8.8 0 16-7.2 16-16V64c0-6.5-3.9-12.3-9.9-14.8s-12.9-1.1-17.4 3.5l-34 34C363.4 52.6 312.1 32 256 32c-10.9 0-21.5 .8-32 2.3V99.2c10.3-2.1 21-3.2 32-3.2zM132.1 154.7l32.6 32.6c4.6 4.6 11.5 5.9 17.4 3.5s9.9-8.3 9.9-14.8V64c0-8.8-7.2-16-16-16H64c-6.5 0-12.3 3.9-14.8 9.9s-1.1 12.9 3.5 17.4l34 34C52.6 148.6 32 199.9 32 256c0 10.9 .8 21.5 2.3 32H99.2c-2.1-10.3-3.2-21-3.2-32c0-38.4 13.5-73.7 36.1-101.3zM477.7 224H412.8c2.1 10.3 3.2 21 3.2 32c0 38.4-13.5 73.7-36.1 101.3l-32.6-32.6c-4.6-4.6-11.5-5.9-17.4-3.5s-9.9 8.3-9.9 14.8V448c0 8.8 7.2 16 16 16H448c6.5 0 12.3-3.9 14.8-9.9s1.1-12.9-3.5-17.4l-34-34C459.4 363.4 480 312.1 480 256c0-10.9-.8-21.5-2.3-32zM256 416c-38.4 0-73.7-13.5-101.3-36.1l32.6-32.6c4.6-4.6 5.9-11.5 3.5-17.4s-8.3-9.9-14.8-9.9H64c-8.8 0-16 7.2-16 16l0 112c0 6.5 3.9 12.3 9.9 14.8s12.9 1.1 17.4-3.5l34-34C148.6 459.4 199.9 480 256 480c10.9 0 21.5-.8 32-2.3V412.8c-10.3 2.1-21 3.2-32 3.2z" />
          </svg>
        </div>
      )}

      {activeContent && (
        <div className="bottomPanel show">
          <div className="caption">{activeContent}</div>
        </div>
      )}
      {activeProfile && (
        <AuthorProfile
          src={urlFix(activeProfile.image || "")}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeNpub}
        ></AuthorProfile>
      )}

      {activeImages.map((image) => (
        <Slide
          key={image.url}
          url={image.url}
          paused={paused}
          type={image.type}
        />
      ))}
    </div>
  );
};

export default SlideShow;
