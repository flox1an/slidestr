import { useEffect, useRef } from 'react';
import { nip19 } from 'nostr-tools';
import uniqBy from 'lodash/uniqBy';
import {
  NostrImage,
  Post,
  extractImageUrls,
  isImage,
  isVideo,
  prepareContent,
} from '../components/nostrImageDownload';
import { ContentType } from './useNav';
import { Settings } from './useNav';

/**
 * Custom hook to extract and deduplicate images from posts
 */
export default function useExtractedImages(posts: Post[], settings: Settings) {
  const images = useRef<NostrImage[]>([]);

  useEffect(() => {
    images.current = uniqBy(
      posts
        .flatMap(p => {
          return extractImageUrls(p.event.content)
            .filter(url => isImage(url) || isVideo(url))
            .filter(url => !url.startsWith('https://creatr.nostr.wine/')) // Filter our creatr.nostr.wine content, since we don't have NIP-98 auth yet.
            .map(url => ({
              post: p,
              url,
              author: nip19.npubEncode(p.event.pubkey),
              authorId: p.event.pubkey,
              content: prepareContent(p.event.content),
              type: (isVideo(url) ? 'video' : 'image') as ContentType,
              timestamp: p.event.created_at,
              noteId: p.event.id || '',
              tags: p.event.tags?.filter((t: string[]) => t[0] === 't').map((t: string[]) => t[1].toLowerCase()) || [],
            }));
        })
        .filter(i => settings.type == 'all' || settings.type == i.type),
      'url'
    );
  }, [posts, settings.type]);

  // Reset images when settings change
  useEffect(() => {
    images.current = [];
  }, [settings]);

  return images;
}
