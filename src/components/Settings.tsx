import { FormEvent, useState } from "react";
import "./Settings.css";
import { useNavigate, useSearchParams } from "react-router-dom";

type Settings = {
  showNsfw: boolean;
  tags: string[];
  npubs: string[];
};
type SettingsProps = {
  onClose: () => void;
  settings: Settings;
};

const Settings = ({ onClose, settings }: SettingsProps) => {
  const [showNsfw, setShowNsfw] = useState(settings.showNsfw || false);
  const [tags, setTags] = useState(settings.tags || []);
  const [npubs, setNpubs] = useState(settings.npubs || []);

  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nsfwPostfix = showNsfw ? "?nsfw=true" : "";

    const validTags = tags.filter((t) => t.length > 0);
    const validNpubs = npubs.filter((t) => t.length > 0);
    
    if (validTags.length > 0) {
      navigate(`/tags/${validTags.join(",")}${nsfwPostfix}`);
    } else if (validNpubs.length == 1) {
      navigate(`/p/${validNpubs[0]}${nsfwPostfix}`);
    } else {
      navigate(`/${nsfwPostfix}`);
    }
    onClose();
  };

  return (
    <div className="settings" onClick={(e) => e.stopPropagation()}>
      <div className="settings-content">
        <label htmlFor="tags">Tags (Comma separated)</label>
        <input
          type="text"
          name="tags"
          id="tags"
          value={tags.join(", ")}
          onChange={(e) =>
            setTags(
              e.target.value
                .split(",")
                .map((t) => t.trim().toLowerCase())
                
            )
          }
        />

        <label htmlFor="npub">User Profile (Npub)</label>
        <input
          type="text"
          name="npub"
          id="npub"
          value={npubs.join(", ")}
          onChange={(e) =>
            setNpubs(
              e.target.value
                .split(",")
                .map((t) => t.trim().toLowerCase())
                
            )
          }
        />

        <div className="content-warning">
          <div>
            <input
              name="nsfw"
              type="checkbox"
              checked={showNsfw}
              onChange={(e) => setShowNsfw(e.target.checked)}
            />
          </div>
          <label
            htmlFor="nsfw"
            onClick={() => setShowNsfw((n) => !n)}
            style={{ userSelect: "none" }}
          >
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

export default Settings;
