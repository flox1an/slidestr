import './App.css';
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import { Provider } from 'jotai';
import { defaultHashTags } from './components/env';
import { NgineProvider } from './context/NgineContext';
import Layout from './components/Layout/Layout';
import SlideShow from './components/SlideShow';

// Wrapper that forces SlideShow to remount when route changes
const SlideShowWithKey = () => {
  const location = useLocation();
  // Use pathname as key to force remount on route change
  return <SlideShow key={location.pathname + location.search} />;
};

const App = () => {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <Navigate to={'/tags/' + defaultHashTags.join(',')} replace />,
        },
        {
          path: 'global',
          element: <SlideShowWithKey />,
        },
        {
          path: 'list/:list',
          element: <SlideShowWithKey />,
        },
        {
          path: 'tags/:tags',
          element: <SlideShowWithKey />,
        },
        {
          path: 'topic/:topic',
          element: <SlideShowWithKey />,
        },
        {
          path: 'profile/:npub',
          element: <SlideShowWithKey />,
        },
        {
          path: 'p/:npub',
          element: <SlideShowWithKey />,
        },
        {
          path: '/follows',
          element: <SlideShowWithKey />,
        },
        {
          path: '/:npub',
          element: <SlideShowWithKey />,
        },
      ],
    },
  ]);

  return (
    <Provider>
      <NgineProvider>
        <RouterProvider router={router} />
      </NgineProvider>
    </Provider>
  );
};

export default App;
