import { NDKFilter } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { nfswTags } from "./env";

export type NostrImage = {
  url: string;
  author: string;
  tags: string[];
  content?: string;
  timestamp: number;
  noteId: string;
  type: "image" | "video";
};

export const buildFilter = (tags: string[], npubs: string[]) => {
  const filter: NDKFilter = {
    kinds: [1, 6],
  };

  if (npubs && npubs.length > 0) {
    filter.authors = npubs.map((p) => nip19.decode(p).data as string);
  } else {
    if (tags && tags.length > 0) {
      filter["#t"] = tags;
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
  // dont use cdn for mp4/webm
  if (url == undefined || url.endsWith(".mp4") || url.endsWith(".webm")) return url;

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
