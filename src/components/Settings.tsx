import { FormEvent, useEffect, useState } from 'react';
import './Settings.css';
import useNav from '../utils/useNav';
import CloseButton from './CloseButton/CloseButton';
import TagEditor, { Tag } from './TagEditor';
import { defaultHashTags } from './env';
import { createImgProxyUrl } from './nostrImageDownload';
import { useGlobalState } from '../utils/globalState';
import { ViewMode } from './SlideShow';
import useProfile from '../ngine/hooks/useProfile';

type SettingsProps = {
  onClose: () => void;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
};

type Mode = 'all' | 'tags' | 'user';

const SettingsDialog = ({ onClose, setViewMode }: SettingsProps) => {
  const { nav, currentSettings } = useNav();
  const [state, setState] = useGlobalState();
  const [showAdult, setShowAdult] = useState(currentSettings.showAdult || false);
  const [showReplies, setShowReplies] = useState(currentSettings.showReplies || false);
  const [showReposts, setShowReposts] = useState(currentSettings.showReposts || false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    currentSettings.tags.map(tag => ({ name: tag, selected: true, deletable: false }))
  );
  const [npubs, setNpubs] = useState(currentSettings.npubs || []);
  const [mode, setMode] = useState<Mode>(
    currentSettings.npubs.length == 1 ? 'user' : currentSettings.tags.length > 0 ? 'tags' : 'all'
  );

  useEffect(() => {
    setState({ ...state, showNavButtons: false });
    return () => setState({ ...state, showNavButtons: true });
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validNpubs = npubs.filter(t => t.length > 0);
    const validTags = selectedTags.filter(t => t.selected).map(t => t.name);
    setViewMode('grid');

    // If the mode is 'user' and there is exactly one validNpubs
    if (mode == 'user' && validNpubs.length == 1) {
      // Navigate with the current settings, but only keep the validNpubs, and reset tags
      nav({
        ...currentSettings,
        tags: [],
        list: undefined,
        topic: undefined,
        npubs: validNpubs,
        showAdult,
        showReplies,
        showReposts,
      });
    }
    // If the mode is 'tags' and there is at least one valid tag
    else if (mode == 'tags' && validTags.length > 0) {
      // Navigate with the current settings, but only keep the validTags, and reset npubs
      nav({
        ...currentSettings,
        tags: validTags,
        list: undefined,
        topic: undefined,
        npubs: [],
        showAdult,
        showReplies,
        showReposts,
      });
    }
    // If the mode is 'tags' but there are no valid tags
    else if (mode == 'tags') {
      // Navigate with the current settings, but reset npubs and use defaultHashTags as tags
      nav({
        ...currentSettings,
        tags: defaultHashTags,
        list: undefined,
        topic: undefined,
        npubs: [],
        showAdult,
        showReplies,
        showReposts,
      });
    }
    // If none of the above conditions are met
    else {
      // Navigate with the current settings, but reset both tags and npubs
      nav({
        ...currentSettings,
        tags: [],
        npubs: [],
        list: undefined,
        topic: undefined,
        showAdult,
        showReplies,
        showReposts,
      });
    }

    onClose();
  };

  const activeProfile = useProfile(npubs[0]);

  return (
    <>
      {' '}
      <div className="settings" onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}></CloseButton>

        <div className="settings-content">
          <div className="settings-mode">
            <div className={mode == 'tags' ? 'active' : ''} onClick={() => setMode('tags')}>
              tags
            </div>
            <div className={mode == 'user' ? 'active' : ''} onClick={() => setMode('user')}>
              user profile
            </div>
            <div className={mode == 'all' ? 'active' : ''} onClick={() => setMode('all')}>
              all of nostr
            </div>
          </div>
          {mode == 'tags' && (
            <>
              <label htmlFor="tags"></label>
              <TagEditor selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
            </>
          )}
          {mode == 'user' && (
            <>
              <label htmlFor="npub">Images for user profile (npub):</label>
              <input
                type="text"
                name="npub"
                id="npub"
                value={npubs.join(', ')}
                onChange={e => setNpubs(e.target.value.split(',').map(t => t.trim().toLowerCase()))}
                onKeyDown={e => e.stopPropagation()}
                onKeyUp={e => e.stopPropagation()}
              />
              {activeProfile && (
                <div className="details-author">
                  <div
                    className="author-image"
                    style={{
                      backgroundImage: activeProfile?.image
                        ? `url(${createImgProxyUrl(activeProfile?.image, 80, 80)})`
                        : 'none',
                    }}
                  ></div>
                  {activeProfile?.displayName || activeProfile?.name}
                </div>
              )}
              <div className="replies">
                <div>
                  <input
                    name="replies"
                    type="checkbox"
                    checked={showReplies}
                    onChange={e => setShowAdult(e.target.checked)}
                  />
                </div>
                <label htmlFor="replies" onClick={() => setShowReplies(n => !n)} style={{ userSelect: 'none' }}>
                  Include Replys
                </label>
              </div>
              <div className="reposts">
                <input
                  name="reposts"
                  type="checkbox"
                  checked={showReposts}
                  onChange={e => setShowAdult(e.target.checked)}
                />
                <label htmlFor="reposts" onClick={() => setShowReposts(n => !n)} style={{ userSelect: 'none' }}>
                  Include Reposts
                </label>
              </div>
            </>
          )}
          <div className="content-warning">
            <div>
              <input name="adult" type="checkbox" checked={showAdult} onChange={e => setShowAdult(e.target.checked)} />
            </div>
            <label htmlFor="adult" onClick={() => setShowAdult(n => !n)} style={{ userSelect: 'none' }}>
              <div className="warning">NSFW / adult content</div>
              Allow adult content to be shown and ignore content warnings.
            </label>
          </div>
        </div>
        <div className="settings-footer">
          <button type="submit" className="btn btn-primary" onClick={onSubmit}>
            Apply settings
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsDialog;
