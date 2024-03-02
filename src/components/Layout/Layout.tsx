import './Layout.css';
import { useState } from 'react';
import Login from '../Login/Login';
import { useGlobalState } from '../../utils/globalState';
import IconUser from '../Icons/IconUser';
import { createImgProxyUrl } from '../nostrImageDownload';
import { Outlet } from 'react-router-dom';
import React from 'react';

const Layout = () => {
  //const { disclaimerAccepted, setDisclaimerAccepted } = useDisclaimerState();
  const [state, setState] = useGlobalState();
  const [showLogin, setShowLogin] = useState(false);

  //   useEffect(() => {
  //     if (currentSettings.npubs.length == 0 && currentSettings.tags.length == 0) {
  //       nav({ ...currentSettings, tags: defaultHashTags, showAdult: false });
  //     }
  //   }, []);

  const onLogout = () => {
    //setAutoLogin(false);
    setState({ userNPub: undefined, profile: undefined });
  };

  return (
    <>
      {showLogin && <Login onClose={() => setShowLogin(false)} />}

      <div className="top-right-controls">
        {state.userNPub && state.profile ? (
          state.profile.image && (
            <img className="profile" onClick={onLogout} src={createImgProxyUrl(state.profile.image, 80, 80)} />
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
