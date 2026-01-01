import './Layout.css';
import { useState, useEffect } from 'react';
import Login from '../Login/Login';
import IconUser from '../Icons/IconUser';
import IconWallet from '../Icons/IconWallet';
import { createImgProxyUrl } from '../nostrImageDownload';
import { Outlet } from 'react-router-dom';
import React from 'react';
import { useLogOut } from '../../context/NgineContext';
import { useSession, useNWC } from '../../state/atoms';
import useProfile from '../../hooks/useProfile';
import WalletSettings from '../WalletSettings/WalletSettings';
import { getBalanceViaNWC } from '../../nostr/nwc';

const formatBalance = (sats: number): string => {
  if (sats >= 1000000) return (sats / 1000000).toFixed(1) + 'M';
  if (sats >= 1000) return (sats / 1000).toFixed(0) + 'k';
  return sats.toString();
};

const Layout = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showWalletSettings, setShowWalletSettings] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const logOut = useLogOut();
  const session = useSession();
  const nwc = useNWC();

  const profile = useProfile(session?.pubkey || '');

  // Fetch wallet balance when NWC is connected
  useEffect(() => {
    if (nwc) {
      getBalanceViaNWC(nwc).then(result => {
        if ('balance' in result) {
          setWalletBalance(result.balance);
        }
      });
    } else {
      setWalletBalance(null);
    }
  }, [nwc]);

  const onLogout = () => {
    logOut();
  };

  return (
    <>
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
      {showWalletSettings && <WalletSettings onClose={() => setShowWalletSettings(false)} />}

      <div className="top-right-controls">
        {session?.pubkey && (
          <button onClick={() => setShowWalletSettings(true)} className="wallet-btn-header" title="Wallet Settings">
            <IconWallet />
            {walletBalance !== null && (
              <span className="wallet-balance">{formatBalance(walletBalance)}</span>
            )}
          </button>
        )}
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
