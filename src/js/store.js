import { createStore } from 'framework7';

const store = createStore({
  state: {
    wallpapers: [],
    loading: false,
  },
  
  actions: {
    async fetchWallpapers({ state }, { page = 1, category = null }) {
      try {
        // Build query parameters
        let params = new URLSearchParams({
          page: page.toString(),
          categories: '111', // Default to all categories
          q: '' // Initialize empty search query
        });

        // Add category-specific search terms
        if (category && category !== 'all') {
          switch(category) {
            case 'landscape':
              params.set('q', 'landscape');
              break;
            case 'space':
              params.set('q', 'space OR galaxy OR cosmos');
              break;
            case 'digital':
              params.set('q', 'digital art');
              break;
            case 'minimal':
              params.set('q', 'minimal OR minimalist');
              break;
            case 'nature':
              params.set('q', 'nature');
              break;
            case 'cars':
              params.set('q', 'car OR cars OR supercar');
              break;
            case 'gaming':
              params.set('q', 'gaming OR game');
              break;
            case 'technology':
              params.set('q', 'technology OR tech');
              break;
            case 'general':
              params.set('categories', '100');
              break;
            case 'anime':
              params.set('categories', '010');
              break;
            case 'people':
              params.set('categories', '001');
              break;
          }
        }

        let url = `https://wallhaven.cc/api/v1/search?${params.toString()}`;
        console.log('Fetching URL:', url);
        
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        
        const data = await response.json();
        console.log('Category response:', data); // Debug log

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
