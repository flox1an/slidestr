import './App.css';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { defaultHashTags } from './components/env';
import Home from './components/Home';
import { NgineProvider } from './ngine/context';
import Layout from './components/Layout/Layout';
import SlideShow from './components/SlideShow';

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
          path: 'topic/:topic',
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
          path: '/follows',
          element: <SlideShow />,
        },
        {
          path: '/:npub',
          element: <SlideShow />,
        },
      ],
    },
  ]);

  return (
    <NgineProvider>
      <RouterProvider router={router} />
    </NgineProvider>
  );
};

export default App;
