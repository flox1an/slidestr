import { useNDK } from "@nostr-dev-kit/ndk-react";
import "./App.css";
import { nip19 } from "nostr-tools";
import React, { useEffect, useRef, useState } from "react";
import { NDKFilter, NDKUser } from "@nostr-dev-kit/ndk";
import AuthorProfile from "./AuthorProfile";
import IconFullScreen from "./IconFullScreen";
import Slide from "./Slide";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
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
*/

type NostrImage = {
  url: string;
  author: NDKUser;
};

const buildFilter = (
  setTitle: React.Dispatch<React.SetStateAction<string>>,
  tags?: string,
  npub?: string
) => {
  const filter: NDKFilter = {
    kinds: [1],
    limit: 1000,
  };

  if (npub) {
    filter.authors = [nip19.decode(npub).data as string];
  } else {
    if (tags) {
      filter["#t"] = tags.split(",");
      setTitle("#" + tags.replace(",", " #") + " | slidestr.net");
    } else {
      setTitle("Random photos from popular hashtags | slidestr.net");

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

const urlFix = (url: string) => {
  // use cdn for nostr.build
  return url.replace(/https?:\/\/nostr.build/, "https://cdn.nostr.build");
};

function extractImageUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return (text.match(urlRegex) || []).map((u) => urlFix(u));
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
  const [title, setTitle] = useState("slidestr.net");
  const { tags, npub } = useParams();

  useEffect(() => {
    const postSubscription = ndk.subscribe(buildFilter(setTitle, tags, npub));

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
    console.log(images.current.length);
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

  useEffect(() => {
    if (
      npub &&
      activeProfile &&
      (activeProfile.displayName || activeProfile.name)
    ) {
      setTitle(
        activeProfile.displayName || activeProfile.name + " | slidestr.net"
      );
    }
  }, [activeProfile]);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
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
          src={urlFix(activeProfile.image || "")}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeNpub}
        ></AuthorProfile>
      )}

      {activeImages.map((image) => (
        <Slide key={image.url} url={image.url} />
      ))}
    </>
  );
};

export default App;
