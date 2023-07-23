import { NDKFilter } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { appName, defaultHashTags, nfswTags } from "./env";

export type NostrImage = {
  url: string;
  author: string;
  tags: string[];
  content?: string;
  type: 'image' | 'video';
};

export const buildFilter = (
  setTitle: React.Dispatch<React.SetStateAction<string>>,
  until?: number,
  tags?: string,
  npub?: string
) => {
  const filter: NDKFilter = {
    kinds: [1],
    limit: 30, // some relays have a low limit
    until: until == -Infinity ? undefined : until,
  };

  if (npub) {
    filter.authors = [nip19.decode(npub).data as string];
  } else {
    if (tags) {
      setTitle("#" + tags.replace(",", " #") + ` | ${appName}`);
      filter["#t"] = tags.split(",");
    } else {
      setTitle(`Random photos from popular hashtags | ${appName}`);
      filter["#t"] = defaultHashTags;
      //setTitle(`Random photos from global feed | ${appName}`);
    }
  }

  console.log("filter", filter);
  return filter;
};

export const prepareContent = (content: string) => {
  return content
    .replace(/https?:\/\/[^\s]+/g, "") // remove all urls
    .replace(/#[^\s]+/g, ""); // remove all tags
};

export const urlFix = (url: string) => {
  // use cdn for nostr.build
  return url.replace(/https?:\/\/nostr.build/, "https://cdn.nostr.build");
};

export const extractImageUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return (text.match(urlRegex) || []).map((u) => urlFix(u));
};

export const isReply = (event: any) => {
  // ["e", "aab5a68f29d76a04ad79fe7e489087b802ee0f946689d73b0e15931dd40a7af3", "", "reply"]
  return (
    event.tags.filter((t: string[]) => t[0] === "e" && t[3] === "reply")
      .length > 0
  );
};

export const hasContentWarning = (event: any) => {
  // ["content-warning", "NSFW: implied nudity"]
  return (
    event.tags.filter((t: string[]) => t[0] === "content-warning").length > 0
  );
};

export const hasNsfwTag = (event: any) => {
  // ["e", "aab5a68f29d76a04ad79fe7e489087b802ee0f946689d73b0e15931dd40a7af3", "", "reply"]
  return (
    event.tags.filter((t: string[]) => t[0] === "t" && nfswTags.includes(t[1]))
      .length > 0
  );
};
