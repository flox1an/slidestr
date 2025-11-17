import React from 'react';
import { ViewMode } from './SlideShow';
import IconPlay from './Icons/IconPlay';
import IconFullScreen from './Icons/IconFullScreen';
import IconHeart from './Icons/IconHeart';
import IconBolt from './Icons/IconBolt';
import IconSearch from './Icons/IconSearch';
import IconRepost from './Icons/IconRepost';
import IconBookmark from './Icons/IconBookmark';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

interface BottomControlsProps {
  showNavButtons: boolean;
  viewMode: ViewMode;
  isMobile: boolean;
  sessionPubkey: string | undefined;
  activeImage: any;
  bookmarkState: boolean | undefined;
  bookmarkClick: () => void;
  repostState: boolean;
  repostClick: () => void;
  heartState: string;
  heartClick: (image: any) => void;
  zapState: string;
  zapClick: (image: any) => void;
  profile: NDKUserProfile | undefined;
  setViewMode: (mode: ViewMode) => void;
  setShowSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
}

/**
 * Bottom control buttons for the slideshow interface
 */
const BottomControls: React.FC<BottomControlsProps> = ({
  showNavButtons,
  viewMode,
  isMobile,
  sessionPubkey,
  activeImage,
  bookmarkState,
  bookmarkClick,
  repostState,
  repostClick,
  heartState,
  heartClick,
  zapState,
  zapClick,
  profile,
  setViewMode,
  setShowSettings,
}) => {
  const fullScreen = document.fullscreenElement !== null;

  if (!showNavButtons) return null;

  return (
    <div className="bottom-controls">
      {sessionPubkey && activeImage && (
        <>
          <button className={`bookmark ${bookmarkState ? 'bookmarked' : ''}`} onClick={() => bookmarkClick()}>
            <IconBookmark></IconBookmark>
          </button>
          <button className={`repost ${repostState ? 'reposted' : ''}`} onClick={() => !repostState && repostClick()}>
            <IconRepost></IconRepost>
          </button>
          <button className={`heart ${heartState}`} onClick={() => activeImage && heartClick(activeImage)}>
            <IconHeart></IconHeart>
          </button>
          {(profile?.lud06 || profile?.lud16) && (
            <button className={`zap ${zapState}`} onClick={() => activeImage && zapClick(activeImage)}>
              <IconBolt></IconBolt>
            </button>
          )}
        </>
      )}

      {viewMode == 'grid' && !isMobile && (
        <button
          onClick={e => {
            e.stopPropagation();
            setViewMode('slideshow');
            return true;
          }}
          title={'play slideshow (G)'}
        >
          <IconPlay />
        </button>
      )}

      {viewMode != 'slideshow' && (
        <button onClick={() => setShowSettings(s => !s)}>
          <IconSearch />
        </button>
      )}

      {viewMode == 'slideshow' && !fullScreen && (
        <button onClick={() => document?.getElementById('root')?.requestFullscreen()}>
          <IconFullScreen />
        </button>
      )}
    </div>
  );
};

export default BottomControls;
