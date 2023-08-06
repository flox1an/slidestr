import React from 'react';
import ReactDOM from 'react-dom/client';
import { NDKProvider } from '@nostr-dev-kit/ndk-react';
import App from './App';
import './index.css';
import { defaultRelays } from './components/env';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import GlobalState from './utils/globalState';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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
    path: '/:npub',
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <NDKProvider relayUrls={defaultRelays}>
    <GlobalState>
      <RouterProvider router={router} />
    </GlobalState>
  </NDKProvider>
);
