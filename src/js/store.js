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
        return data.data.map(wallpaper => ({
          id: wallpaper.id,
          title: `Wallpaper ${wallpaper.id}`,
          thumbnailUrl: wallpaper.thumbs.large,
          fullUrl: wallpaper.path,
          resolution: wallpaper.resolution,
          category: wallpaper.category,
          views: wallpaper.views,
          favorites: wallpaper.favorites
        }));
        
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
        state.wallpapers = data.data.map(wallpaper => ({
          id: wallpaper.id,
          title: `Wallpaper ${wallpaper.id}`,
          thumbnailUrl: wallpaper.thumbs.large,
          fullUrl: wallpaper.path,
          resolution: wallpaper.resolution,
          category: wallpaper.category,
          views: wallpaper.views,
          favorites: wallpaper.favorites
        }));
        
      } catch (error) {
        console.error('Error searching wallpapers:', error);
      }
    }
  }
});

export default store;
