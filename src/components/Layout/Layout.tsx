import './Layout.css';
import { useState, useEffect, useRef } from 'react';
import Login from '../Login/Login';
import IconUser from '../Icons/IconUser';
import IconWallet from '../Icons/IconWallet';
import IconChevronDown from '../Icons/IconChevronDown';
import { createImgProxyUrl } from '../nostrImageDownload';
import { Outlet } from 'react-router-dom';
import React from 'react';
import { useLogOut } from '../../context/NgineContext';
import { useSession, useNWC } from '../../state/atoms';
import useProfile from '../../hooks/useProfile';
import WalletSettings from '../WalletSettings/WalletSettings';
import { getBalanceViaNWC } from '../../nostr/nwc';
import { nip19 } from 'nostr-tools';

const formatBalance = (sats: number): string => {
  if (sats >= 1000000) return (sats / 1000000).toFixed(1) + 'M';
  if (sats >= 1000) return (sats / 1000).toFixed(0) + 'k';
  return sats.toString();
};

const Layout = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showWalletSettings, setShowWalletSettings] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const logOut = useLogOut();
  const session = useSession();
  const nwc = useNWC();

  const profile = useProfile(session?.pubkey || '');
  const displayName = profile?.displayName || profile?.display_name || profile?.name || 'Signed in';
  const npub = session?.pubkey ? nip19.npubEncode(session.pubkey) : '';
  const shortNpub = npub ? `${npub.slice(0, 12)}...${npub.slice(-6)}` : '';

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

  useEffect(() => {
    if (!showAccountMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showAccountMenu]);

  const onLogout = () => {
    setShowAccountMenu(false);
    logOut();
  };

  const openWalletSettings = () => {
    setShowAccountMenu(false);
    setShowWalletSettings(true);
  };

  return (
    <>
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
      {showWalletSettings && <WalletSettings onClose={() => setShowWalletSettings(false)} />}

      <div className="top-right-controls">
        {session?.pubkey ? (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className="account-menu-trigger"
              onClick={() => setShowAccountMenu(open => !open)}
              aria-haspopup="menu"
              aria-expanded={showAccountMenu}
              aria-label="Account menu"
              title="Account menu"
            >
              {profile?.image ? (
                <img
                  referrerPolicy="no-referrer"
                  className="profile"
                  src={createImgProxyUrl(profile.image, 80, 80)}
                  alt=""
                />
              ) : (
                <span className="profile-fallback">
                  <IconUser />
                </span>
              )}
              <span className="account-chevron">
                <IconChevronDown />
              </span>
            </button>

            {showAccountMenu && (
              <div className="account-menu-dropdown" role="menu">
                <div className="account-menu-user">
                  <div className="account-menu-label">Logged in as</div>
                  <div className="account-menu-name">{displayName}</div>
                  <div className="account-menu-npub">{shortNpub}</div>
                </div>

                <button type="button" className="account-menu-item" onClick={openWalletSettings} role="menuitem">
                  <IconWallet />
                  <span>
                    Wallet
                    {walletBalance !== null && <small>{formatBalance(walletBalance)} sats</small>}
                  </span>
                </button>

                <button type="button" className="account-menu-item danger" onClick={onLogout} role="menuitem">
                  <IconUser />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
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
