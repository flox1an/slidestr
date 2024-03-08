import { appName, topics } from '../components/env';
import { useEffect, useState } from 'react';
import { Settings } from './useNav';
import { NostrImage } from '../components/nostrImageDownload';
import useProfileNgine from '../ngine/hooks/useProfile';
import { nip19 } from 'nostr-tools';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { useLocation, useParams } from 'react-router-dom';

// TODO maybe remove profile and only build title here?? useTitle?

const useProfile = (settings: Settings, activeImage?: NostrImage) => {
  const [title, setTitle] = useState(appName);
  const location = useLocation();
  const { topic } = useParams();

  const profileNpub = settings.npubs.length == 1 ? settings.npubs[0] : activeImage && activeImage?.author;

  const pubKeyHex = profileNpub ? (nip19.decode(profileNpub).data as string) : '';
  const activeProfile = useProfileNgine(pubKeyHex, NDKSubscriptionCacheUsage.ONLY_RELAY);

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

  return {
    activeProfile,
    title,
    profileNpub,
    pubKeyHex,
  };
};

export default useProfile;
