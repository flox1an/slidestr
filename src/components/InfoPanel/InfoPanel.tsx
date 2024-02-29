import React from 'react';
import uniq from 'lodash/uniq';
import { NostrImage, urlFix } from '../nostrImageDownload';
import useNav, { Settings } from '../../utils/useNav';
import './InfoPanel.css';
import IconChevronDown from '../Icons/IconChevronDown';
import { ViewMode } from '../SlideShow';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import useProfile from '../../utils/useProfile';
import { useGlobalState } from '../../utils/globalState';
import IconLink from '../Icons/IconLink';
import { nip19 } from 'nostr-tools';

type InfoPanelProps = {
  image: NostrImage;
  onClose: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  settings: Settings;
};

const InfoPanel = ({ image, onClose, setViewMode, settings }: InfoPanelProps) => {
  const { nav, currentSettings } = useNav();
  const [state] = useGlobalState();
  const { activeProfile, profileNpub } = useProfile(settings, state.activeImage);

  const profile = activeProfile && (
    <AuthorProfile
      src={urlFix(activeProfile.image || '')}
      author={activeProfile.displayName || activeProfile.name}
      npub={profileNpub}
      setViewMode={setViewMode}
      followButton
    ></AuthorProfile>
  );

  return (
    <div className="info-panel">
      {profile && (
        <div className="info-panel-author">
          {profile}
          {image?.noteId && (
            <a className="link" target="_blank" href={`https://nostrapp.link/#${nip19.noteEncode(image?.noteId)}`}>
              <IconLink></IconLink>
            </a>
          )}
        </div>
      )}

      <div className="info-panel-content">{image?.content} </div>

      {image.tags.length > 0 && (
        <div className="info-panel-tags">
          {uniq(image?.tags).map(t => (
            <>
              <span
                className="tag"
                onClick={() => {
                  //setCurrentImage(undefined);
                  setViewMode('grid');
                  nav({ ...currentSettings, tags: [t], npubs: [], list: undefined, topic: undefined, follows: false });
                }}
              >
                {t}
              </span>{' '}
            </>
          ))}
        </div>
      )}
      <div className="info-panel-footer">
        <button onClick={() => onClose()}>
          <IconChevronDown />
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
