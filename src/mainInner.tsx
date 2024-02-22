import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { defaultRelays } from './components/env';
import Home from './components/Home';
import { NgineProvider } from './ngine/context';
import NDK from '@nostr-dev-kit/ndk';
import { useEffect } from 'react';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';

const cacheAdapterDexie = new NDKCacheAdapterDexie({ dbName: "slidestr" });
const ndk = new NDK({
  explicitRelayUrls: defaultRelays,
  outboxRelayUrls: ["wss://purplepag.es"],
  enableOutboxModel: true, 
  //signer: new NDKNip07Signer(),
  cacheAdapter: cacheAdapterDexie as any // types don't in the current version
});

const MainInner = () => {
  //const [state] = useGlobalState();

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Home />,
    },
    {
      path: 'global',
      element: <App />,
    },
    {
      path: 'tags/:tags',
      element: <App />,
    },
    {
      path: 'profile/:npub',
      element: <App />,
    },
    {
      path: 'p/:npub',
      element: <App />,
    },
    {
      path: '/followers',
      element: <App />,
    },
    {
      path: '/:npub',
      element: <App />,
    },
  ]);

  useEffect(() => {
    ndk.connect();
  }, []);


  return (<NgineProvider ndk={ndk}>
      <RouterProvider router={router} />
    </NgineProvider>)
};

export default MainInner;
