import HomePage from '../pages/home.f7';
import WallpaperPage from '../pages/wallpaper.f7';
import CollectionsPage from '../pages/collections.f7';
import NotFoundPage from '../pages/404.f7';
import CollectionPage from '../pages/collection.f7';
import AboutPage from '../pages/about.f7';

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/collections/',
    component: CollectionsPage,
  },
  {
    path: '/wallpaper/',
    component: WallpaperPage,
  },
  {
    path: '/collection/:id/',
    component: CollectionPage,
  },
  {
    path: '/about/',
    component: AboutPage,
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;