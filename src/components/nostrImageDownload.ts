import { NDKEvent, NDKFilter, NDKTag } from '@nostr-dev-kit/ndk';
import { adultContentTags, adultPublicKeys, imageProxy, mixedAdultNPubs } from './env';
import uniq from 'lodash/uniq';
import { unixNow } from '../ngine/time';

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

export const buildFilter = (tags: string[], authors: string[], withReposts = false) => {
  const filter: NDKFilter = {
    kinds: [1, 1063] as number[],
    limit: authors.length > 0 ? 1000 : tags.length > 0 ? 500 : 500,
  };

  if (withReposts) {
    filter.kinds?.push(6);
  }

  if (authors && authors.length > 0) {
    filter.authors = authors;
  } else if (tags && tags.length > 0) {
    filter['#t'] = tags;
  } else {
    filter.since = unixNow() - 60 * 60 * 24; // 24h
  }

  // console.log('filter', filter);
  return filter;
};

export const prepareContent = (content: string) => {
  return content
    .replace(/https?:\/\/[^\s]+/g, '') // remove all urls
    .replace(/#[^\s]+/g, '') // remove all tags
    .trim();
};

export const urlFix = (url: string) => {
  // dont use cdn for mp4/webm
  if (url == undefined || url.endsWith('.mp4') || url.endsWith('.webm')) return url;

  // remove google lens prefix (used in meme posts)
  url = url.replace(/https:\/\/lens.google.com\/uploadbyurl\?url=/, '');

  // remove fuzzysearch prefix (used in meme posts)
  url = url.replace(/https:\/\/fuzzysearch.net\/#url=/, '');

  // redirect on www.nogood.store does not work properly
  url = url.replace(/https:\/\/www.nogood.store/, 'https://www.nogood.studio');

  // use cdn for nostr.build
  return url.replace(/https?:\/\/nostr.build/, 'https://cdn.nostr.build');
};

export const extractImageUrls = (text: string): string[] => {
  if (text == undefined) return [];

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matchedUrls = (text.match(urlRegex) || []).map(u => urlFix(u));
  return uniq(matchedUrls);
};

export const isReply = ({ tags }: { tags?: NDKTag[] }) => {
  if (!tags) return false;
  // ["e", "aab5a68f29d76a04ad79fe7e489087b802ee0f946689d73b0e15931dd40a7af3", "", "reply"]
  // [ "e", "0c77a63189d2d9f7d5c28c589e7784600b31c8ebc33050946a70436e02a442e2", "", "root" ],
  return tags.filter((t: string[]) => t[0] === 'e' && (t[3] === 'reply' || t[3] === 'root')).length > 0;
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
  // Imggur does not allow localhost as a referrer. Apparently the
  // imgproxy sets the Referrer header, that is why we disable the
  // imgproxy for imgur.com here.
  if (url.includes('imgur.com')) {
    return url;
  }

  const heightParam = height < 0 ? '' : ':' + height;

  return `${imageProxy}/insecure/f:webp/rs:fill:${width}${heightParam}/plain/${url}`;
};
