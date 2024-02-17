import { appName } from '../components/env';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { useEffect, useState } from 'react';
import { Settings } from './useNav';
import { NostrImage } from '@/components/nostrImageDownload';

const useProfile = (settings: Settings, activeImage?: NostrImage) => {
  const { getProfile } = useNDK();
  const [title, setTitle] = useState(appName);

  const profileNpub = settings.npubs.length == 1 ? settings.npubs[0] : activeImage && activeImage?.author;

  const activeProfile = profileNpub && getProfile(profileNpub);

  useEffect(() => {
    if (settings.npubs.length > 0 && activeProfile && (activeProfile.displayName || activeProfile.name)) {
      setTitle((activeProfile.displayName || activeProfile.name) + ` | ${appName}`);
    } else if (settings.tags && settings.tags.length > 0) {
      setTitle('#' + settings.tags.join(' #') + ` | ${appName}`);
    } else {
      setTitle(`Random photos from popular hashtags | ${appName}`);
    }
  }, [activeProfile, settings.npubs, settings.tags]);

  return {
    activeProfile,
    title,
    profileNpub,
  };
};

export default useProfile;
