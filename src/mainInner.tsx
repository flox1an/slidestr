import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { NDKProvider } from '@nostr-dev-kit/ndk-react';
import { defaultRelays } from './components/env';
import Home from './components/Home';

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

  return (
    <NDKProvider relayUrls={defaultRelays}>
      <RouterProvider router={router} />
    </NDKProvider>
  );
};

export default MainInner;
