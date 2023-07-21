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

let oldest = Infinity;
let maxFetchCount = 20;
let eventsReceived = 0;

type SlideShowProps = {
  tags?: string;
  npub?: string;
  showNsfw: boolean;
};

const SlideShow = ({ tags, npub, showNsfw = false }: SlideShowProps) => {
  const { ndk, getProfile, loadNdk } = useNDK();
  const [posts, setPosts] = useState<any[]>([]);
  const images = useRef<NostrImage[]>([]);
  const [activeImages, setActiveImages] = useState<NostrImage[]>([]);
  const [history, setHistory] = useState<NostrImage[]>([]);

  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const upcommingImage = useRef<NostrImage>();
  const [title, setTitle] = useState(appName);
  const [loading, setLoading] = useState(true);
  const [activeNpub, setActiveNpub] = useState<string | undefined>(undefined);
  const [activeContent, setActiveContent] = useState<string | undefined>(
    undefined
  );
  const timeoutHandle = useRef(0);

  const fetch = () => {
    const until = oldest < Infinity ? oldest : undefined;
    const untilPerRelay: { [n: string]: number } = {};
    eventsReceived = 0;
    console.log(`starting fetch with until ${until}`);

    const postSubscription = ndk.subscribe(
      buildFilter(setTitle, until, tags, npub)
    );

    postSubscription.on("event", (event) => {
      eventsReceived++;
      if (
        untilPerRelay[event.relay.url] === undefined ||
        event.created_at < untilPerRelay[event.relay.url]
      ) {
        untilPerRelay[event.relay.url] = event.created_at;
      }

      setPosts((oldPosts) => {
        if (
          !isReply(event) &&
          oldPosts.findIndex((p) => p.id === event.id) === -1 &&
          (showNsfw ||
            (!hasContentWarning(event) && // only allow content warnings on profile content
              !hasNsfwTag(event))) && // only allow nsfw on profile content
          !nsfwPubKeys.includes(event.pubkey.toLowerCase()) // block nsfw authors
        ) {
          return [...oldPosts, event];
        }
        return oldPosts;
      });
    });

    postSubscription.on("notice", (notice) => {
      console.log("NOTICE: ", notice);
    });

    if (maxFetchCount > 0) {
      maxFetchCount--;
      setTimeout(() => {
        console.log(JSON.stringify(untilPerRelay));
        console.log(`eventsReceived ${eventsReceived}`);

        oldest = Math.max(...Object.values(untilPerRelay));
        if (eventsReceived > 0) fetch();
      }, 3000);
    }
  };

  useEffect(() => {
    loadNdk([
      "wss://relay.nostr.band",
      "wss://nos.lol",
      "wss://relay.mostr.pub",
      "wss://purplepag.es/", // needed for user profiles

      //"wss://feeds.nostr.band/pics"
    ]);
    fetch();
  }, []);

  const animateImages = () => {
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

        setHistory((oldHistory) => [...oldHistory, randomImage]);
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
            url.endsWith(".jpeg") ||
            url.endsWith(".webp")
        )
        .map((url) => ({
          url,
          author: p.author.npub,
          content: prepareContent(p.content),
          tags: p.tags
            .filter((t: string[]) => t[0] === "t")
            .map((t: string[]) => t[1].toLowerCase()),
        }));
    });
    console.log(images.current.length);

    // Make sure we have an image to start with but only trigger once
    if (upcommingImage.current === undefined && images.current.length > 2) {
      queueNextImage(1000);
    }
  }, [posts]);

  const onKeyDown = (event: KeyboardEvent) => {
    // console.log(event);
    if (event.key === "ArrowRight") {
      setPaused(false);
      setActiveImages([]);
      queueNextImage(0);
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

  const queueNextImage = (waitTime = 8000) => {
    clearTimeout(timeoutHandle.current);
    timeoutHandle.current = setTimeout(() => {
      if (!paused) {
        setLoading(false);
        animateImages();
        queueNextImage();
      }
    }, waitTime);
  };

  useEffect(() => {
    queueNextImage();
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
      npub &&
      activeProfile &&
      (activeProfile.displayName || activeProfile.name)
    ) {
      setTitle(
        activeProfile.displayName || activeProfile.name + ` | ${appName}`
      );
    }
  }, [activeProfile]);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>

      {showSettings && <Settings></Settings>}

      {!fullScreen && (
        <div className="controls">
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
        <Slide key={image.url} url={image.url} paused={paused} />
      ))}
    </>
  );
};

export default SlideShow;
