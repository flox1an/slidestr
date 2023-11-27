import { appName } from "../components/env";
import { useNDK } from "@nostr-dev-kit/ndk-react";
import { useEffect, useState } from "react";
import { Settings } from "./useNav";

const useProfile = (settings: Settings) => {
    const { getProfile } = useNDK();
    const [title, setTitle] = useState(appName);
  
    const activeProfile = settings.npubs.length == 1 && getProfile(settings.npubs[0]);

    useEffect(() => {
      if (settings.npubs.length > 0 && activeProfile && (activeProfile.displayName || activeProfile.name)) {
        setTitle((activeProfile.displayName || activeProfile.name) + ` | ${appName}`);
      }
      else if (settings.tags && settings.tags.length > 0) {
        setTitle('#' + settings.tags.join(' #') + ` | ${appName}`);
      } else {
        setTitle(`Random photos from popular hashtags | ${appName}`);
      }
    }, [activeProfile, settings.npubs, settings.tags]);

    return {
        activeProfile,
        title
    }
}

export default useProfile;