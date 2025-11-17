import { useEffect, useState } from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { Post, isReply, isAdultRelated } from '../components/nostrImageDownload';
import { blockedPublicKeys } from '../data/blocklist';
import { Settings } from './useNav';

/**
 * Custom hook to process and filter Nostr events into posts
 */
export default function useProcessedPosts(events: NDKEvent[], settings: Settings) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(
      events
        .filter(
          event =>
            !blockedPublicKeys.includes(event.pubkey.toLowerCase()) && // remove blocked authors
            (settings.showReplies || !isReply(event)) &&
            (settings.showAdult || !isAdultRelated(event, settings.tags.length > 0))
        )
        .map(event => {
          // Hack: Write URL in the content for file events
          if (event.kind === 1063) {
            const urlTag = event?.tags?.find(t => t[0] == 'url');
            if (urlTag) {
              event.content = urlTag[1];
            }
          }

          // Convert reposts to the original event
          if (event.kind === 6 && event.content) {
            try {
              const repostedEvent = JSON.parse(event.content);
              if (repostedEvent) {
                event = repostedEvent;
              }
            } catch (e) {
              // ignore, the content is no valid json
            }
          }

          return { event };
        })
    );
  }, [events, settings.showReplies, settings.showAdult, settings.tags.length]);

  // Reset posts when settings change
  useEffect(() => {
    setPosts([]);
  }, [settings]);

  return posts;
}
