import { useEffect, createContext, useContext, ReactNode, useState } from 'react';
import { useAtom, Provider } from 'jotai';
import { kinds, nip19 } from 'nostr-tools';
import type { NostrEvent, EventTemplate } from 'nostr-tools';

// Applesauce imports
import { AccountManager } from 'applesauce-accounts';
import { registerCommonAccountTypes } from 'applesauce-accounts/accounts';
import {
  ExtensionAccount,
  NostrConnectAccount,
  PrivateKeyAccount,
  ReadonlyAccount,
} from 'applesauce-accounts/accounts';
import { ExtensionSigner, NostrConnectSigner, PrivateKeySigner } from 'applesauce-signers';
import { EventFactory } from 'applesauce-factory';
import { AccountsProvider, EventStoreProvider, FactoryProvider } from 'applesauce-react/providers';
import { useActiveAccount } from 'applesauce-react/hooks';

// Local imports
import { eventStore, connectToRelays } from '../nostr/core';
import { syncUserRelays } from '../nostr/relays';
import {
  saveAccountToStorage,
  saveActiveAccount,
  removeAccountFromStorage,
  restoreAccountsToManager,
} from '../nostr/accountPersistence';

import useRates from './hooks/useRates';
import useLatestEvent from './hooks/useLatestEvent';
import { sessionAtom, relayListAtom, followsAtom, ratesAtom } from './state';
import { Links } from './types';
import { getNip05For } from '../utils/nip05';

// Create AccountManager and EventFactory at module level
const accountManager = new AccountManager();
registerCommonAccountTypes(accountManager);
const factory = new EventFactory({ signer: accountManager.signer });

// Export for use elsewhere
export { accountManager, factory };

interface NgineContextProps {
  nip07Login: () => Promise<string | undefined>;
  nip46Login: (url: string) => Promise<string | undefined>;
  nsecLogin: (nsec: string) => Promise<string>;
  npubLogin: (npub: string) => Promise<string>;
  sign: (ev: Omit<NostrEvent, 'pubkey' | 'id' | 'sig'>) => Promise<NostrEvent | undefined>;
  logOut: () => void;
  links?: Links;
}

const NgineContext = createContext<NgineContextProps>({
  nip07Login: () => {
    return Promise.reject();
  },
  nip46Login: () => {
    return Promise.reject();
  },
  nsecLogin: () => {
    return Promise.reject();
  },
  npubLogin: () => {
    return Promise.reject();
  },
  sign: () => {
    return Promise.reject();
  },
  logOut: () => {},
  links: {},
});

interface NgineProviderProps {
  links?: Links;
  children: ReactNode;
  enableFiatRates?: boolean;
  locale?: string;
}

function SessionProvider({ pubkey, children }: { pubkey: string; children: ReactNode }) {
  const [contactList, setContacts] = useAtom(followsAtom);
  const [relayList, setRelayList] = useAtom(relayListAtom);

  // Contacts
  const contacts = useLatestEvent(
    {
      kinds: [kinds.Contacts],
      authors: [pubkey],
    },
    {
      closeOnEose: false,
    }
  );

  useEffect(() => {
    if (contacts) {
      const lastSeen = contactList?.created_at ?? 0;
      const createdAt = contacts.created_at ?? 0;
      if (createdAt > lastSeen) {
        setContacts(contacts);
      }
    }
  }, [contacts]);

  // Relays
  const relays = useLatestEvent(
    {
      kinds: [kinds.RelayList],
      authors: [pubkey],
    },
    {
      closeOnEose: false,
    }
  );

  useEffect(() => {
    if (relays) {
      const lastSeen = relayList?.created_at ?? 0;
      const createdAt = relays.created_at ?? 0;
      if (createdAt > lastSeen) {
        setRelayList(relays);
        // Sync relay pool with user's relay preferences
        syncUserRelays(pubkey);
      }
    }
  }, [relays]);

  return children;
}

/**
 * Component to restore accounts from localStorage on mount
 */
function AccountRestoreInit() {
  const [restored, setRestored] = useState(false);
  const [, setSession] = useAtom(sessionAtom);

  useEffect(() => {
    if (!restored) {
      restoreAccountsToManager(accountManager).then(() => {
        setRestored(true);
        // If we have an active account after restore, update session
        const active = accountManager.active;
        if (active) {
          // Map account type to session method
          let method: 'nip07' | 'nip46' | 'npub' | 'nsec' = 'npub';
          if (active instanceof ExtensionAccount) {
            method = 'nip07';
          } else if (active instanceof NostrConnectAccount) {
            method = 'nip46';
          } else if (active instanceof PrivateKeyAccount) {
            method = 'nsec';
          } else if (active instanceof ReadonlyAccount) {
            method = 'npub';
          }
          setSession({
            method,
            pubkey: active.pubkey,
          });
        }
      });
    }
  }, [restored]);

  return null;
}

export const NgineProvider = ({ links, children, enableFiatRates = false }: NgineProviderProps) => {
  const [session, setSession] = useAtom(sessionAtom);
  const [, setFollows] = useAtom(followsAtom);
  const [, setRelays] = useAtom(relayListAtom);
  const [, setRates] = useAtom(ratesAtom);
  const rates = useRates(!enableFiatRates);

  // Connect to default relays on mount
  useEffect(() => {
    connectToRelays();
  }, []);

  useEffect(() => {
    setRates(rates);
  }, [rates]);

  async function nip07Login(): Promise<string | undefined> {
    try {
      const account = await ExtensionAccount.fromExtension();
      accountManager.addAccount(account);
      accountManager.setActive(account);

      saveAccountToStorage(account, 'extension');
      saveActiveAccount(account.pubkey);

      setSession({
        method: 'nip07',
        pubkey: account.pubkey,
      });

      // Sync user relays after login
      syncUserRelays(account.pubkey);

      return account.pubkey;
    } catch (error) {
      console.error('Extension login failed:', error);
      return undefined;
    }
  }

  async function getNostrConnectSettings(url: string) {
    if (url.includes('bunker://')) {
      const asURL = new URL(url);
      const relays = asURL.searchParams.getAll('relay');
      const pubkey = asURL.pathname.replace(/^\/\//, '');
      return { relays, pubkey, bunkerUri: url };
    } else {
      // Handle NIP-05 addresses
      const user = await getNip05For(url);
      if (user) {
        const pubkey = user.pubkey;
        const relays = user.nip46 && user.nip46.length > 0 ? user.nip46 : ['wss://relay.nsecbunker.com'];
        // Construct bunker URI from NIP-05 info
        const bunkerUri = `bunker://${pubkey}?${relays.map(r => `relay=${encodeURIComponent(r)}`).join('&')}`;
        return {
          pubkey,
          relays,
          bunkerUri,
        };
      }
    }
    return undefined;
  }

  async function nip46Login(url: string): Promise<string | undefined> {
    try {
      const settings = await getNostrConnectSettings(url);
      if (!settings) {
        console.error('Could not get NostrConnect settings');
        return undefined;
      }

      const { bunkerUri } = settings;

      // Create signer from bunker URI
      const signer = await NostrConnectSigner.fromBunkerURI(bunkerUri, {
        onAuth: async (authUrl: string) => {
          window.open(authUrl, 'auth', 'width=600,height=600');
        },
      });

      const pubkey = await signer.getPublicKey();

      // Create account
      const account = new NostrConnectAccount(pubkey, signer);
      accountManager.addAccount(account);
      accountManager.setActive(account);

      // Save to storage (using the bunker URI)
      saveAccountToStorage(account, 'bunker', bunkerUri);
      saveActiveAccount(pubkey);

      setSession({
        method: 'nip46',
        pubkey,
        bunker: {
          privkey: '', // Not needed with new implementation
          relays: settings.relays,
        },
      });

      // Sync user relays after login
      syncUserRelays(pubkey);

      return pubkey;
    } catch (error) {
      console.error('Bunker login failed:', error);
      return undefined;
    }
  }

  async function npubLogin(pubkey: string): Promise<string> {
    // Handle npub format
    let hexPubkey = pubkey;
    if (pubkey.startsWith('npub')) {
      const decoded = nip19.decode(pubkey);
      if (decoded.type === 'npub') {
        hexPubkey = decoded.data;
      }
    }

    // Create read-only account
    const account = ReadonlyAccount.fromPubkey(hexPubkey);
    accountManager.addAccount(account);
    accountManager.setActive(account);

    // Save to storage (npub accounts are read-only)
    saveAccountToStorage(account, 'npub');
    saveActiveAccount(hexPubkey);

    setSession({
      method: 'npub',
      pubkey: hexPubkey,
    });

    // Sync user relays
    syncUserRelays(hexPubkey);

    return hexPubkey;
  }

  async function nsecLogin(privkey: string): Promise<string> {
    // Handle nsec format
    let hexPrivkey = privkey;
    if (privkey.startsWith('nsec')) {
      const decoded = nip19.decode(privkey);
      if (decoded.type === 'nsec') {
        hexPrivkey = decoded.data as unknown as string;
      }
    }

    // Create private key account
    const account = PrivateKeyAccount.fromKey(hexPrivkey);
    const pubkey = await account.signer.getPublicKey();

    accountManager.addAccount(account);
    accountManager.setActive(account);

    // Note: We don't store nsec for security - user must re-enter on reload
    saveAccountToStorage(account, 'nsec');
    saveActiveAccount(pubkey);

    setSession({
      method: 'nsec',
      pubkey,
      privkey: hexPrivkey,
    });

    // Sync user relays
    syncUserRelays(pubkey);

    return pubkey;
  }

  async function sign(
    ev: Omit<NostrEvent, 'pubkey' | 'id' | 'sig'>
  ): Promise<NostrEvent | undefined> {
    const activeAccount = accountManager.active;
    if (!activeAccount) {
      console.log('No active account for signing');
      return undefined;
    }

    // Check if account can sign (not read-only)
    if (activeAccount instanceof ReadonlyAccount) {
      console.log('Cannot sign with read-only account');
      return undefined;
    }

    try {
      const template: EventTemplate = {
        kind: ev.kind,
        content: ev.content,
        tags: ev.tags,
        created_at: ev.created_at ?? Math.floor(Date.now() / 1000),
      };

      const signedEvent = await activeAccount.signer.signEvent(template);
      return signedEvent as NostrEvent;
    } catch (error) {
      console.error('Failed to sign event:', error);
      return undefined;
    }
  }

  function logOut() {
    const activeAccount = accountManager.active;
    if (activeAccount) {
      // Remove from storage
      removeAccountFromStorage(activeAccount.pubkey);
      // Remove from account manager
      accountManager.removeAccount(activeAccount);
    }

    accountManager.clearActive();
    setSession(null);
    setFollows(null);
    setRelays(null);
  }

  return (
    <AccountsProvider manager={accountManager}>
      <EventStoreProvider eventStore={eventStore}>
        <FactoryProvider factory={factory}>
          <NgineContext.Provider
            value={{
              nip07Login,
              nip46Login,
              nsecLogin,
              npubLogin,
              sign,
              logOut,
              links,
            }}
          >
            <Provider>
              <AccountRestoreInit />
              {session ? (
                <SessionProvider pubkey={session.pubkey}>{children}</SessionProvider>
              ) : (
                children
              )}
            </Provider>
          </NgineContext.Provider>
        </FactoryProvider>
      </EventStoreProvider>
    </AccountsProvider>
  );
};

export const useExtensionLogin = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.nip07Login;
};

export const usePubkeyLogin = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.npubLogin;
};

export const useBunkerLogin = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.nip46Login;
};

export const useNsecLogin = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.nsecLogin;
};

export const useSign = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.sign;
};

/**
 * @deprecated Use useActiveAccount() from 'applesauce-react/hooks' instead
 */
export const useNDK = () => {
  console.warn('useNDK is deprecated. The app no longer uses NDK.');
  return null;
};

/**
 * Returns the signer from the active account
 */
export const useSigner = () => {
  const activeAccount = useActiveAccount();
  return activeAccount?.signer;
};

type LinkType = keyof Links;

export const useLink = (type: LinkType, value: string): string | null => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  if (context.links && context.links[type]) {
    return context.links[type](value);
  }
  return null;
};

export const useLinks = (): Links | undefined => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.links;
};

export const useLogOut = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.logOut;
};
