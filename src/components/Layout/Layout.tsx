import './Layout.css';
import { useState } from 'react';
import Login from '../Login/Login';
import IconUser from '../Icons/IconUser';
import { createImgProxyUrl } from '../nostrImageDownload';
import { Outlet } from 'react-router-dom';
import React from 'react';
import { useLogOut } from '../../ngine/context';
import { useSession } from '../../ngine/state';
import useProfile from '../../ngine/hooks/useProfile';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

const Layout = () => {
  //const { disclaimerAccepted, setDisclaimerAccepted } = useDisclaimerState();
  const [showLogin, setShowLogin] = useState(false);
  const logOut = useLogOut();
  const session = useSession();
  
  const profile =  useProfile(session?.pubkey || '', NDKSubscriptionCacheUsage.CACHE_FIRST);

  //   useEffect(() => {
  //     if (currentSettings.npubs.length == 0 && currentSettings.tags.length == 0) {
  //       nav({ ...currentSettings, tags: defaultHashTags, showAdult: false });
  //     }
  //   }, []);

  const onLogout = () => {
    logOut();
  };


  return (
    <>
      {showLogin && <Login onClose={() => setShowLogin(false)} />}

      <div className="top-right-controls">
        {session?.pubkey && profile ? (
          profile.image && (
            <img
              referrerPolicy="no-referrer"
              className="profile"
              onClick={onLogout}
              src={createImgProxyUrl(profile.image, 80, 80)}
            />
          )
        ) : (
          <button onClick={() => setShowLogin(true)} className="login">
            <IconUser></IconUser>
          </button>
        )}
      </div>

      <Outlet />
      {/*
      {disclaimerAccepted ? (
        <Outlet />
      ) : (
        <Disclaimer disclaimerAccepted={disclaimerAccepted} setDisclaimerAccepted={setDisclaimerAccepted} />
      )}
       */}
    </>
  );
};

export default Layout;
