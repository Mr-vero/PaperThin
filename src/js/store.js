import { createStore } from 'framework7';

const store = createStore({
  state: {
    wallpapers: [],
    loading: false,
  },
  
  actions: {
    async fetchWallpapers({ state }, { page = 1 }) {
      try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(
          `https://wallhaven.cc/api/v1/search?page=${page}`
        )}`);
        
        const data = await response.json();
        console.log('API Response:', data);

        return data.data.map(wallpaper => {
          const placeholderUrl = `https://wsrv.nl/?url=${encodeURIComponent(wallpaper.thumbs.small)}&w=100&blur=5`;
          const thumbnailUrl = `https://wsrv.nl/?url=${encodeURIComponent(wallpaper.path)}&w=800&h=1200&fit=cover&q=90&output=webp`;
          
          return {
            id: wallpaper.id,
            title: `Wallpaper ${wallpaper.id}`,
            placeholderUrl,
            thumbnailUrl,
            fallbackUrls: [
              wallpaper.path,
              wallpaper.thumbs.large,
              `https://corsproxy.io/?${encodeURIComponent(wallpaper.path)}`,
            ],
            fullUrl: wallpaper.path,
            resolution: wallpaper.resolution,
            category: wallpaper.category,
            views: wallpaper.views,
            favorites: wallpaper.favorites
          };
        });
        
      } catch (error) {
        console.error('Error fetching wallpapers:', error);
        return [];
      }
    },

    async searchWallpapers({ state }, query) {
      try {
        // First, update state to show loading
        state.loading = true;
        
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(
          `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&page=1`
        )}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Search response:', data);

        if (!data || !data.data) {
          throw new Error('Invalid response format');
        }

        // Return the transformed data instead of updating state directly
        return data.data.map(wallpaper => {
          const placeholderUrl = `https://wsrv.nl/?url=${encodeURIComponent(wallpaper.thumbs.small)}&w=100&blur=5`;
          const thumbnailUrl = `https://wsrv.nl/?url=${encodeURIComponent(wallpaper.path)}&w=800&h=1200&fit=cover&q=90&output=webp`;
          
          return {
            id: wallpaper.id,
            title: `Wallpaper ${wallpaper.id}`,
            placeholderUrl,
            thumbnailUrl,
            fallbackUrls: [
              wallpaper.path,
              wallpaper.thumbs.large,
              `https://corsproxy.io/?${encodeURIComponent(wallpaper.path)}`,
            ],
            fullUrl: wallpaper.path,
            resolution: wallpaper.resolution,
            category: wallpaper.category,
            views: wallpaper.views,
            favorites: wallpaper.favorites,
            loaded: false
          };
        });
        
      } catch (error) {
        console.error('Error searching wallpapers:', error);
        if (typeof window !== 'undefined' && window.f7) {
          window.f7.toast.show({
            text: 'Error searching wallpapers. Please try again.',
            closeTimeout: 2000,
            position: 'bottom'
          });
        }
        return [];
      } finally {
        state.loading = false;
      }
    }
  }
});

export default store;
