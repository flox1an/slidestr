import { useEffect, createContext, useContext, ReactNode } from 'react';
import { useAtom, Provider } from 'jotai';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NDK, {
  NDKKind,
  NDKNip07Signer,
  NDKNip46Signer,
  NDKPrivateKeySigner,
  NDKUser,
  NostrEvent,
  NDKEvent,
  NDKSigner,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk';
import useRates from './hooks/useRates';
import useLatestEvent from './hooks/useLatestEvent';
import { sessionAtom, relayListAtom, followsAtom, ratesAtom } from './state';
import { Links } from './types';
import { getNip05For } from '../utils/nip05';

const queryClient = new QueryClient();

interface NgineContextProps {
  ndk: NDK;
  nip07Login: () => Promise<NDKUser | undefined>;
  nip46Login: (url: string) => Promise<NDKUser | undefined>;
  nsecLogin: (nsec: string) => Promise<NDKUser>;
  npubLogin: (npub: string) => Promise<NDKUser>;
  sign: (ev: Omit<NostrEvent, 'pubkey'>, signer?: NDKSigner) => Promise<NDKEvent | undefined>;
  logOut: () => void;
  links?: Links;
}

const NgineContext = createContext<NgineContextProps>({
  ndk: new NDK({ explicitRelayUrls: [] }),
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
  ndk: NDK;
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
      kinds: [NDKKind.Contacts],
      authors: [pubkey],
    },
    {
      cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
      closeOnEose: false,
    }
  );

  useEffect(() => {
    if (contacts) {
      const lastSeen = contactList?.created_at ?? 0;
      const createdAt = contacts.created_at ?? 0;
      if (createdAt > lastSeen) {
        setContacts(contacts.rawEvent());
      }
    }
  }, [contacts]);

  // Relays

  const relays = useLatestEvent(
    {
      kinds: [NDKKind.RelayList],
      authors: [pubkey],
    },
    {
      cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
      closeOnEose: false,
    }
  );

  useEffect(() => {
    if (relays) {
      const lastSeen = relayList?.created_at ?? 0;
      const createdAt = relays.created_at ?? 0;
      if (createdAt > lastSeen) {
        setRelayList(relays.rawEvent());
      }
    }
  }, [relays]);

  return children;
}

export const NgineProvider = ({ ndk, links, children, enableFiatRates = false }: NgineProviderProps) => {
  const [session, setSession] = useAtom(sessionAtom);
  const [, setFollows] = useAtom(followsAtom);
  const [, setRelays] = useAtom(relayListAtom);
  const [, setRates] = useAtom(ratesAtom);
  const rates = useRates(!enableFiatRates);

  useEffect(() => {
    setRates(rates);
  }, [rates]);

  useEffect(() => {
    if (session?.method === 'nip07') {
      const signer = new NDKNip07Signer();
      ndk.signer = signer;
    } else if (session?.method === 'nsec') {
      const signer = new NDKPrivateKeySigner(session.privkey);
      ndk.signer = signer;
    } else if (session?.method === 'nip46' && session.bunker) {
      const { privkey, relays } = session.bunker;
      const localSigner = new NDKPrivateKeySigner(privkey);
      const bunkerNDK = new NDK({ explicitRelayUrls: relays });
      bunkerNDK.connect().then(() => {
        const signer = new NDKNip46Signer(bunkerNDK, session.pubkey, localSigner);
        signer.on('authUrl', url => {
          window.open(url, 'auth', 'width=600,height=600');
        });
        ndk.signer = signer;
      });
    }
    // todo: nip05
  }, [session]);

  async function nip07Login() {
    const signer = new NDKNip07Signer();
    const user = await signer.blockUntilReady();
    if (user) {
      ndk.signer = signer;
      user.ndk = ndk;
      setSession({
        method: 'nip07',
        pubkey: user.pubkey,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const profile = await user.fetchProfile({
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      });
    }
    return user;
  }

  async function getNostrConnectSettings(url: string) {
    if (url.includes('bunker://')) {
      const asURL = new URL(url);
      const relays = asURL.searchParams.getAll('relay');
      const pubkey = asURL.pathname.replace(/^\/\//, '');
      return { relays, pubkey };
    } else {
      // const user = await NDKUser.fromNip05(url, ndk, true);  // TODO needs PR FIX in NDK
      const user = await getNip05For(url); // WORKAROUND local implementation
      if (user) {
        const pubkey = user.pubkey;
        const relays = user.nip46 && user.nip46.length > 0 ? user.nip46 : ['wss://relay.nsecbunker.com'];
        return {
          pubkey,
          relays,
        };
      }
    }
  }

  function createOrLoadPrivateKeySigner() {
    const LS_NIP46_KEY = 'nip64key';
    const existingKey = localStorage.getItem(LS_NIP46_KEY);
    if (existingKey) {
      return new NDKPrivateKeySigner(existingKey);
    } else {
      const generatedSigner = NDKPrivateKeySigner.generate();
      const generatedKey = generatedSigner.privateKey;
      if (generatedKey) {
        localStorage.setItem(LS_NIP46_KEY, generatedKey);
      }
      return generatedSigner;
    }
  }

  async function nip46Login(url: string) {
    const settings = await getNostrConnectSettings(url);
    if (settings) {
      const { pubkey, relays } = settings;
      const bunkerNDK = new NDK({
        explicitRelayUrls: relays,
      });
      await bunkerNDK.connect();
      const localSigner = createOrLoadPrivateKeySigner();
      console.log('localSigner', localSigner);
      const signer = new NDKNip46Signer(bunkerNDK, pubkey, localSigner);
      console.log('signer', signer);
      signer.on('authUrl', url => {
        window.open(url, 'auth', 'width=600,height=600');
      });
      const user = await signer.blockUntilReady();
      if (user) {
        ndk.signer = signer;
        user.ndk = ndk;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const profile = await user.fetchProfile({
          cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        });

        setSession({
          method: 'nip46',
          pubkey,
          bunker: {
            privkey: localSigner.privateKey as string,
            relays,
          },
        });
      }
      return user;
    }
  }

  async function npubLogin(pubkey: string) {
    const user = ndk.getUser({ hexpubkey: pubkey });
    setSession({
      method: 'npub',
      pubkey: pubkey,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const profile = await user.fetchProfile({
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    });
    return user;
  }

  async function nsecLogin(privkey: string) {
    const signer = new NDKPrivateKeySigner(privkey);
    const user = await signer.blockUntilReady();
    if (user) {
      ndk.signer = signer;
      setSession({
        method: 'nsec',
        pubkey: user.pubkey,
        privkey,
      });
    }
    return user;
  }

  async function sign(ev: Omit<NostrEvent, 'pubkey'>, signer?: NDKSigner) {
    if (signer) {
      const user = await signer.user();
      const ndkEvent = new NDKEvent(ndk, { ...ev, pubkey: user.pubkey });
      await ndkEvent.sign(signer);
      return ndkEvent;
    } else if (session?.pubkey && session?.method !== 'npub') {
      const ndkEvent = new NDKEvent(ndk, { ...ev, pubkey: session.pubkey });
      await ndkEvent.sign();
      return ndkEvent;
    } else {
      console.log('Could not sign event', ev);
    }
  }

  function logOut() {
    ndk.signer = undefined;
    setSession(null);
    setFollows(null);
    setRelays(null);
  }

  return (
    <NgineContext.Provider
      value={{
        ndk,
        nip07Login,
        nip46Login,
        nsecLogin,
        npubLogin,
        sign,
        logOut,
        links,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Provider>
          {session ? <SessionProvider pubkey={session.pubkey}>{children}</SessionProvider> : children}
        </Provider>
      </QueryClientProvider>
    </NgineContext.Provider>
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

export const useNDK = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.ndk;
};

export const useSigner = () => {
  const context = useContext(NgineContext);
  if (context === undefined) {
    throw new Error('Ngine context not found');
  }
  return context.ndk.signer;
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
