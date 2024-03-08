import './AuthorProfile.css';
import useImageLoaded from '../../utils/useImageLoaded';
import { createImgProxyUrl } from '../nostrImageDownload';
import useNav from '../../utils/useNav';
import { ViewMode } from '../SlideShow';
import IconLink from '../Icons/IconLink';
import FollowButton from '../FollowButton/FollowButton';
import { nip19 } from 'nostr-tools';
import React from 'react';
import { useSession } from '../../ngine/state';

type AvatarImageProps = {
  src?: string;
  author?: string;
  npub?: string;
  setViewMode: (viewMode: ViewMode) => void;
  followButton?: boolean;
  externalLink?: boolean;
};

const AuthorProfile = ({
  src,
  author,
  npub,
  setViewMode,
  followButton = false,
  externalLink = false,
}: AvatarImageProps) => {
  const avatarLoaded = useImageLoaded(src);
  const { nav, currentSettings } = useNav();
  const session = useSession();
  
  const followButtonAvailable = followButton && session?.pubkey;

  return (
    <div className="author-info">
      <div className="author-identity">
        <div
          className="author-image"
          onClick={() => {
            setViewMode && setViewMode('grid');
            npub &&
              nav({ ...currentSettings, tags: [], npubs: [npub], list: undefined, topic: undefined, follows: false });
          }}
          style={{
            backgroundImage: avatarLoaded && src ? `url(${createImgProxyUrl(src, 80, 80)})` : 'none',
          }}
        ></div>
        <span
          className="author-name"
          onClick={() => {
            setViewMode && setViewMode('grid');
            npub &&
              nav({ ...currentSettings, tags: [], npubs: [npub], list: undefined, topic: undefined, follows: false });
          }}
        >
          {author}
        </span>
      </div>
      <div className="author-actions">
        {followButtonAvailable && npub && (
          <FollowButton pubkey={nip19.decode(npub).data as string} className="btn btn-primary" />
        )}

        {externalLink && npub && (
          <a target="_blank" href={`https://nostrapp.link/#${npub}`}>
            <IconLink></IconLink>
          </a>
        )}
      </div>
    </div>
  );
};

export default AuthorProfile;
