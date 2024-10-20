import React, { useEffect } from 'react';
import { MouseEventHandler, SyntheticEvent, useMemo, useState } from 'react';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import useProfile from '../../ngine/hooks/useProfile';
import useNav from '../../utils/useNav';
import LazyLoad from 'react-lazy-load';
import uniq from 'lodash/uniq';
import { timeDifference } from '../../utils/time';
import { unixNow } from '../../ngine/time';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

interface MasonryImageProps {
  image: NostrImage;
  onClick?: MouseEventHandler | undefined;
  index: number;
}

const MasonryImage = ({ image, onClick, index }: MasonryImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const { nav, currentSettings } = useNav();
  const [showInfo, setShowInfo] = useState(false);
  const [shouldShowInfo, setShouldShowInfo] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    if (showInfo) {
      setShouldShowInfo(true);
    } else {
      // Wait for fade-out transition to complete before hiding
      timeoutId = setTimeout(() => setShouldShowInfo(false), 200); // 200ms fade-out duration
    }

    return () => clearTimeout(timeoutId);
  }, [showInfo]);

  const tagClick = (tag: string) => {
    nav({ ...currentSettings, tags: [tag], npubs: [], list: undefined, topic: undefined, follows: false });
  };
  const profileClick = (npub: string) => {
    nav({
      ...currentSettings,
      tags: [],
      npubs: [npub],
      list: undefined,
      topic: undefined,
      follows: false,
      showReplies: false,
      showReposts: true,
    });
  };

  const mediaIsVideo = isVideo(image.url);
  const profile = useProfile(image.authorId, NDKSubscriptionCacheUsage.CACHE_FIRST);

  const showAuthor = currentSettings.npubs == undefined || currentSettings.npubs.length != 1; // if we are looking at a single profile, don't show the author

  const description = useMemo(
    () =>
      image.content &&
      image.content.replace(/nostr:[a-z0-9]+/, '').substring(0, 60) + (image.content.length > 60 ? ' ... ' : ' '),
    [image.content]
  );
  const showTags = useMemo(() => uniq(image.tags).slice(0, 5), [image.tags]);
  const now = unixNow();

  return (
    <LazyLoad className="is-relative">
      <div id={'g' + index} onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)}>
        <a>
          {mediaIsVideo ? (
            <video
              className={`mason-image ${loaded ? 'show' : ''}`}
              data-node-id={image.post.event.id}
              key={image.url}
              controls={false}
              autoPlay={false}
              onClick={onClick}
              src={image.url + '#t=0.1'}
              playsInline
              onLoad={() => setLoaded(true)}
            ></video>
          ) : (
            <>
              <img
                referrerPolicy="no-referrer"
                data-node-id={image.post.event.id}
                onError={(e: SyntheticEvent<HTMLImageElement>) => {
                  console.log('not found: ', e.currentTarget.src);
                  e.currentTarget.src = '/notfound.png';
                }}
                style={{ visibility: loaded ? 'visible' : 'hidden' }}
                className={`mason-image ${loaded ? 'show' : ''}`}
                onLoad={() => setLoaded(true)}
                loading="lazy"
                key={image.url}
                onClick={onClick}
                src={createImgProxyUrl(image.url, 320, -1)}
              ></img>
              {
                !loaded && <div style={{ height: 200 }}></div> // Spacer when image is not loaded yet
              }
            </>
          )}
        </a>

        <div className={`info-section ${shouldShowInfo ? 'visible' : ''}`}>
          {shouldShowInfo && (showAuthor || description || showTags.length > 0) && (
            <>
              {showAuthor && (
                <div className="title">
                  <a onClick={() => profileClick(image.author)}>{profile?.displayName || profile?.name}</a>
                  {image.timestamp && <div className="time">{timeDifference(now, image.timestamp)}</div>}
                </div>
              )}
              {description}

              {showTags.map(t => (
                <React.Fragment key={t}>
                  <a onClick={() => tagClick(t)}>#{t}</a>{' '}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>
    </LazyLoad>
  );
};

export default MasonryImage;
