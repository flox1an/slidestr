import { Settings } from './useNav';
import { NostrImage } from '../components/nostrImageDownload';
import { nip19 } from 'nostr-tools';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import useProfile from '../ngine/hooks/useProfile';

const useActiveProfile = (settings: Settings, activeImage?: NostrImage) => {
  const activeNpub = settings.npubs.length == 1 ? settings.npubs[0] : activeImage && activeImage?.author;
  const activePubKeyHex = activeNpub ? (nip19.decode(activeNpub).data as string) : '';
  const activeProfile = useProfile(activePubKeyHex, NDKSubscriptionCacheUsage.CACHE_FIRST);
  return {
    activeProfile,
    activeNpub,
  };
};

export default useActiveProfile;
