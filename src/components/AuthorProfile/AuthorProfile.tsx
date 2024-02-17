import './AuthorProfile.css';
import useImageLoaded from '../../utils/useImageLoaded';
import { createImgProxyUrl } from '../nostrImageDownload';
import useNav from '../../utils/useNav';
import { ViewMode } from '../SlideShow';
import IconLink from '../Icons/IconLink';

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
  return (
    <div
      className="author-info"
      onClick={() => {
        setViewMode && setViewMode('grid');
        npub && nav({ ...currentSettings, tags: [], npubs: [npub] });
      }}
    >
      <div
        className="author-image"
        style={{
          backgroundImage: avatarLoaded && src ? `url(${createImgProxyUrl(src, 80, 80)})` : 'none',
        }}
      ></div>

      <span className="author-name">{author}</span>

      {followButton && (
        <button type="submit" className="btn btn-primary" onClick={() => {}}>
          Follow
        </button>
      )}

      {externalLink && npub && (
        <a target="_blank" href={`https://nostrapp.link/#${npub}`}>
          <IconLink></IconLink>
        </a>
      )}
    </div>
  );
};

export default AuthorProfile;
