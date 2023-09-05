import { NDKEvent, NDKFilter, NDKTag } from '@nostr-dev-kit/ndk';
import { Kind, nip19 } from 'nostr-tools';
import { adultContentTags, adultPublicKeys, mixedAdultNPubs } from './env';

export type Post = {
  event: NDKEvent;
  wasZapped?: boolean;
  wasLiked?: boolean;
};

export type NostrImage = {
  url: string;
  author: string;
  authorId: string; // PubKey
  tags: string[];
  content?: string;
  timestamp?: number;
  noteId: string;
  type: 'image' | 'video';
  post: Post;
};

export const buildFilter = (tags: string[], npubs: string[], withReposts = false) => {
  const filter: NDKFilter = {
    kinds: [1, 1063] as Kind[],
  };

  if (withReposts) {
    filter.kinds?.push(6);
  }

  if (npubs && npubs.length > 0) {
    filter.authors = npubs.map(p => nip19.decode(p).data as string);
  } else {
    if (tags && tags.length > 0) {
      filter['#t'] = tags;
    }
  }

  console.log('filter', filter);
  return filter;
};

export const prepareContent = (content: string) => {
  return content
    .replace(/https?:\/\/[^\s]+/g, '') // remove all urls
    .replace(/#[^\s]+/g, ''); // remove all tags
};

export const urlFix = (url: string) => {
  // dont use cdn for mp4/webm
  if (url == undefined || url.endsWith('.mp4') || url.endsWith('.webm')) return url;

  // use cdn for nostr.build
  return url.replace(/https?:\/\/nostr.build/, 'https://cdn.nostr.build');
};

export const extractImageUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return (text.match(urlRegex) || []).map(u => urlFix(u));
};

export const isReply = ({ tags }: { tags?: NDKTag[] }) => {
  if (!tags) return false;
  // ["e", "aab5a68f29d76a04ad79fe7e489087b802ee0f946689d73b0e15931dd40a7af3", "", "reply"]
  return tags.filter((t: string[]) => t[0] === 'e' && t[3] === 'reply').length > 0;
};

export const hasContentWarning = ({ tags }: { tags?: NDKTag[] }) => {
  if (!tags) return false;
  // ["content-warning", "NSFW: implied nudity"]
  return tags.filter((t: string[]) => t[0] === 'content-warning').length > 0;
};

export const hasAdultTag = ({ tags }: { tags?: NDKTag[] }) => {
  if (!tags) return false;
  // ["e", "aab5a68f29d76a04ad79fe7e489087b802ee0f946689d73b0e15931dd40a7af3", "", "reply"]
  return tags.filter((t: string[]) => t[0] === 't' && adultContentTags.includes(t[1])).length > 0;
};

export const isAdultRelated = ({ tags, pubkey }: { tags?: NDKTag[]; pubkey: string }, isTagSearch: boolean) => {
  // if we search for a specific non adult tag and the user in the mixed category
  // allow as non adult 
  if (isTagSearch && mixedAdultNPubs.includes(pubkey.toLowerCase()) && !hasAdultTag({ tags })) {
    return false;
  }

  return (
    hasContentWarning({ tags }) || // block content warning
    hasAdultTag({ tags }) || // block adult tags
    mixedAdultNPubs.includes(pubkey.toLowerCase()) || // block mixed adult authors
    adultPublicKeys.includes(pubkey.toLowerCase()) // block adult authors
  );
};

export const isImage = (url: string) => {
  const fileExtension = url.split('.').pop();
  if (fileExtension == undefined) return false;
  const imageExtensions = ['jpg', 'png', 'gif', 'jpeg', 'webp'];
  return imageExtensions.includes(fileExtension);
};

export const isVideo = (url: string) => {
  return url.endsWith('.mp4') || url.endsWith('.webm');
};

export const createImgProxyUrl = (url: string, width = 200, height = 200) => {
  if (
    url.includes('imgur.com') ||
    url.includes('cdn.midjourney.com') ||
    url.includes('wasabisys.com') ||
    url.includes('files.mastodon.social') ||
    url.includes('files.mastodon.online') ||
    url.includes('media.mastodon.scot') ||
    url.includes('media.mas.to') ||
    url.includes('smutlandia.com') ||
    url.includes('file.misskey.design')
  )
    return url;
  return `https://imgproxy.iris.to/insecure/rs:fill:${width}:${height}/plain/${url}`;
};
