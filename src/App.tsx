import { useNDK } from "@nostr-dev-kit/ndk-react";
import "./App.css";
import { nip19 } from "nostr-tools";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { NDKFilter, NDKUser } from "@nostr-dev-kit/ndk";
import AuthorProfile from "./AuthorProfile";
import IconFullScreen from "./IconFullScreen";

type NostrImage = {
  url: string;
  author: NDKUser;
};

const parseUrl = () => {
  let npub: string | undefined = undefined;
  let tags: string | undefined = undefined;
  if (window.location.pathname.startsWith("/npub")) {
    npub = window.location.pathname.replace("/", "");
  }
  if (window.location.hash.startsWith("#")) {
    tags = window.location.hash.replace("#", "");
  }
  return { npub, tags };
};

const buildFilter = () => {
  const filter: NDKFilter = {
    kinds: [1],
    limit: 1000,
  };

  const { npub, tags } = parseUrl();

  if (npub) {
    filter.authors = [nip19.decode(npub).data as string];
  } else {
    if (tags) {
      filter["#t"] = tags.split(",");
    } else {
      // Default tags
      filter["#t"] = [
        "photography",
        "photostr",
        "artstr",
        "art",
        "catstr",
        "dogstr",
        "nature",
      ];
    }
  }

  return filter;
};

function extractImageUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

const isReply = (event: any) => {
  // ["e", "aab5a68f29d76a04ad79fe7e489087b802ee0f946689d73b0e15931dd40a7af3", "", "reply"]
  return (
    event.tags.filter((t: string[]) => t[0] === "e" && t[3] === "reply")
      .length > 0
  );
};

const App = () => {
  const { ndk, getProfile } = useNDK();
  const [posts, setPosts] = useState<any[]>([]);
  const images = useRef<NostrImage[]>([]);
  const [activeImages, setActiveImages] = useState<NostrImage[]>([]);
  const upcommingImage = useRef<NostrImage>();

  useEffect(() => {
    const postSubscription = ndk.subscribe(buildFilter());

    postSubscription.on("event", (event) => {
      setPosts((oldPosts) => {
        if (
          !isReply(event) &&
          oldPosts.findIndex((p) => p.id === event.id) === -1
        ) {
          return [...oldPosts, event];
        }
        return oldPosts;
      });
    });
  }, []);

  const animateImages = () => {
    setActiveImages((oldImages) => {
      const newImages = [...oldImages];
      if (newImages.length > 2) {
        // always keep 2 images
        newImages.shift();
      }
      if (images.current.length > 0) {
        const randomImage =
          images.current[Math.floor(Math.random() * images.current.length)];
        newImages.push(randomImage);
        upcommingImage.current = randomImage;
      }
      return newImages;
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
        .map((url) => ({ url, author: p.author }));
    });
  }, [posts]);

  useEffect(() => {
    setTimeout(() => {
      // Make sure we have an image to start with but only trigger once
      if (upcommingImage.current === undefined) animateImages();
    }, 500);

    const intervalHandle = setInterval(() => animateImages(), 8000);
    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  const fullScreen = document.fullscreenElement !== null;

  const activeNpub = upcommingImage?.current?.author?.npub;
  const activeProfile = activeNpub && getProfile(activeNpub);

  return (
    <>
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

      {activeProfile && (
        <AuthorProfile
          src={activeProfile.image}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeNpub}
        ></AuthorProfile>
      )}

      {activeImages.map((image) => (
        <div
          key={image.url}
          className="slide"
          style={{
            backgroundImage: `url(${image.url})`,
          }}
        ></div>
      ))}
    </>
  );
};

export default App;
