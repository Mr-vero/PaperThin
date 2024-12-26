import $ from 'dom7';
import Framework7, { getDevice } from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Import Capacitor APIs
import capacitorApp from './capacitor-app.js';
// Import Routes
import routes from './routes.js';
// Import Store
import store from './store.js';

// Import main app component
import App from '../app.f7';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        type: 'module'
      });
      console.log('ServiceWorker registration successful with scope:', registration.scope);
    } catch (err) {
      console.error('ServiceWorker registration failed:', err);
    }
  });
}

var device = getDevice();
var app = new Framework7({
  name: 'Paper Thin', // App name
  theme: 'ios', // Automatic theme detection
  darkMode: 'auto',
  colors: {
    primary: '#ff4b3e',
  },

  el: '#app', // App root element
  component: App, // App main component
  // App store
  store: store,
  // App routes
  routes: routes,

  // Register service worker (only on production build)
  serviceWorker: process.env.NODE_ENV ==='production' ? {
    path: '/service-worker.js',
    scope: '/'
  } : {},
  // Input settings
  input: {
    scrollIntoViewOnFocus: device.capacitor,
    scrollIntoViewCentered: device.capacitor,
  },
  // Capacitor Statusbar settings
  statusbar: {
    iosOverlaysWebView: true,
    androidOverlaysWebView: true,
    androidBackgroundColor: '#ececf1',
    androidTextColor: 'white'
  },
  on: {
    init: function () {
      var f7 = this;
      if (f7.device.capacitor) {
        // Init capacitor APIs (see capacitor-app.js)
        capacitorApp.init(f7);
      }
      
      //Handle dark mode changes
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const updateTheme = (isDark) => {
        // Update status bar color
        document.querySelector('meta[name="theme-color"]').setAttribute(
          'content',
          isDark ? '#000000' : '#ececf1'
        );
        
        // Update app theme
        f7.setDarkMode(isDark);
        
        // Force UI update
        document.documentElement.classList.toggle('theme-dark', isDark);
      };
      
      // Initial setup
      updateTheme(darkModeMediaQuery.matches);
      
      // Listen for system dark mode changes
      darkModeMediaQuery.addEventListener('change', (e) => {
        updateTheme(e.matches);
      });

      // Listen for manual theme toggles
      window.addEventListener('themechange', (e) => {
        updateTheme(e.detail.isDark);
      });
    },
  },
});

// Export app instance
export default app;