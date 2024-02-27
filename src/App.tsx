import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { defaultRelays } from './components/env';
import Home from './components/Home';
import { NgineProvider } from './ngine/context';
import NDK from '@nostr-dev-kit/ndk';
import { useEffect } from 'react';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';
import Layout from './components/Layout/Layout';
import SlideShow from './components/SlideShow';

const cacheAdapterDexie = new NDKCacheAdapterDexie({ dbName: 'slidestr' });
const ndk = new NDK({
  explicitRelayUrls: defaultRelays,
  outboxRelayUrls: ['wss://purplepag.es'],
  enableOutboxModel: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cacheAdapter: cacheAdapterDexie as any, // types don't in the current version
});

const App = () => {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <Home />,
        },
        {
          path: 'global',
          element: <SlideShow />,
        },
        {
          path: 'list/:list',
          element: <SlideShow />,
        },
        {
          path: 'tags/:tags',
          element: <SlideShow />,
        },
        {
          path: 'profile/:npub',
          element: <SlideShow />,
        },
        {
          path: 'p/:npub',
          element: <SlideShow />,
        },
        {
          path: '/followers',
          element: <SlideShow />,
        },
        {
          path: '/:npub',
          element: <SlideShow />,
        },
      ],
    },
  ]);

  useEffect(() => {
    ndk.connect();
  }, []);

  return (
    <NgineProvider ndk={ndk}>
      <RouterProvider router={router} />
    </NgineProvider>
  );
};

export default App;
