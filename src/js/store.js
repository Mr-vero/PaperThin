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
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(
          `https://wallhaven.cc/api/v1/search?q=${query}`
        )}`);
        
        const data = await response.json();
        state.wallpapers = data.data.map(wallpaper => {
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
        console.error('Error searching wallpapers:', error);
      }
    }
  }
});

export default store;
