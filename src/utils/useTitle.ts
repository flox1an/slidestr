import { appName, topics } from '../components/env';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Settings } from './useNav';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

const useTitle = (settings: Settings, activeProfile?: NDKUserProfile) => {
  const [title, setTitle] = useState(appName);
  const location = useLocation();
  const { topic } = useParams();

  useEffect(() => {
    if (settings.npubs.length > 0 && activeProfile && (activeProfile.displayName || activeProfile.name)) {
      setTitle((activeProfile.displayName || activeProfile.name) + ` | ${appName}`);
    } else if (settings.tags && settings.tags.length > 0) {
      setTitle('#' + settings.tags.join(' #') + ` | ${appName}`);
    } else if (topic) {
      setTitle(`${topics[topic].name} | ${appName}`);
    } else if (location.pathname == '/global') {
      setTitle(`Global | ${appName}`);
    } else if (location.pathname == '/') {
      setTitle(`Home | ${appName}`);
    }
  }, [activeProfile, settings.npubs, settings.tags, topic, location]);

  return title;
};

export default useTitle;
