import { FormEvent, useState } from 'react';
import './Settings.css';
import useNav, { Settings } from '../utils/useNav';

type SettingsProps = {
  onClose: () => void;
  settings: Settings;
};

const SettingsDialog = ({ onClose, settings }: SettingsProps) => {
  const [showNsfw, setShowNsfw] = useState(settings.showNsfw || false);
  const [tags, setTags] = useState(settings.tags || []);
  const [npubs, setNpubs] = useState(settings.npubs || []);
  const { nav, currentSettings } = useNav();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validTags = tags.filter(t => t.length > 0);
    const validNpubs = npubs.filter(t => t.length > 0);

    if (validTags.length > 0) {
      nav({ ...currentSettings, tags: validTags, npubs: [], showNsfw });
    } else if (validNpubs.length == 1) {
      nav({ ...currentSettings, tags: [], npubs: validNpubs, showNsfw });
    } else {
      nav({ ...currentSettings, tags: [], npubs: [], showNsfw });
    }
    onClose();
  };

  return (
    <div className="settings" onClick={e => e.stopPropagation()}>
      <h2>Settings</h2>

      <div className="settings-content">
        <label htmlFor="tags">Tags (Comma separated):</label>
        <textarea
          name="tags"
          rows={4}
          id="tags"
          value={tags.join(', ')}
          onChange={e => setTags(e.target.value.split(',').map(t => t.trim().toLowerCase()))}
        ></textarea>

        <label htmlFor="npub">User Profile (Npub):</label>
        <input
          type="text"
          name="npub"
          id="npub"
          value={npubs.join(', ')}
          onChange={e => setNpubs(e.target.value.split(',').map(t => t.trim().toLowerCase()))}
        />

        <div className="content-warning">
          <div>
            <input name="nsfw" type="checkbox" checked={showNsfw} onChange={e => setShowNsfw(e.target.checked)} />
          </div>
          <label htmlFor="nsfw" onClick={() => setShowNsfw(n => !n)} style={{ userSelect: 'none' }}>
            <div className="warning">NSFW Content</div>
            Allow NSFW to be shown and ignore content warnings.
          </label>
        </div>
      </div>
      <div className="settings-footer">
        <button type="submit" className="btn btn-primary" onClick={onSubmit}>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsDialog;
