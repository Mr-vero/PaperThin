import { createStore } from 'framework7';

const store = createStore({
  state: {
    wallpapers: [],
    loading: false,
    collections: [],
  },
  
  actions: {
    async fetchWallpapers({ state }, { page = 1, category = null }) {
      try {
        // Build query parameters
        let params = new URLSearchParams({
          page: page.toString(),
          categories: '111', // Default to all categories
          purity: '100', // 1 = sfw, 1 = sketchy, 0 = nsfw (100 = sfw only)
          q: '', // Initialize empty search query
          sorting: 'toplist',
          order: 'desc',
          topRange: '1M'
        });

        // Add category-specific search terms
        if (category && category !== 'all') {
          switch(category) {
            case 'nsfw':
              params.set('purity', '001'); // Enable NSFW content
              params.set('categories', '111');
              break;
            case 'sketchy':
              params.set('purity', '010'); // Enable Sketchy content
              params.set('categories', '111');
              break;
            case 'landscape':
              params.set('q', 'landscape');
              params.set('sorting', 'relevance');
              break;
            case 'space':
              params.set('q', 'space OR galaxy OR cosmos');
              params.set('sorting', 'relevance');
              break;
            case 'digital':
              params.set('q', 'digital art');
              params.set('sorting', 'relevance');
              break;
            case 'minimal':
              params.set('q', 'minimal OR minimalist');
              params.set('sorting', 'relevance');
              break;
            case 'nature':
              params.set('q', 'nature');
              params.set('sorting', 'relevance');
              break;
            case 'cars':
              params.set('q', 'car OR cars OR supercar');
              params.set('sorting', 'relevance');
              break;
            case 'gaming':
              params.set('q', 'gaming OR game');
              params.set('sorting', 'relevance');
              break;
            case 'technology':
              params.set('q', 'technology OR tech');
              params.set('sorting', 'relevance');
              break;
            case 'general':
              params.set('categories', '100');
              params.set('sorting', 'toplist');
              break;
            case 'anime':
              params.set('categories', '010');
              params.set('sorting', 'toplist');
              break;
            case 'people':
              params.set('categories', '001');
              params.set('sorting', 'toplist');
              break;
          }
        }

        // Add quality filters
        params.append('atleast', '1920x1080');
        params.append('ratios', '16x9,16x10');

        let url = `https://wallhaven.cc/api/v1/search?${params.toString()}`;
        console.log('Fetching URL:', url);
        
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

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
    },

    async fetchCollections({ state }) {
      try {
        // Get collections from localStorage
        const collectionsData = localStorage.getItem('collections');
        console.log('Raw collections data:', collectionsData);
        
        if (!collectionsData) {
          state.collections = [];
          return [];
        }
        
        const collections = JSON.parse(collectionsData);
        console.log('Parsed collections:', collections);
        
        // Ensure each collection has a wallpapers array
        collections.forEach(collection => {
          if (!collection.wallpapers) {
            collection.wallpapers = [];
          }
        });
        
        state.collections = collections;
        return collections;
      } catch (error) {
        console.error('Error fetching collections:', error);
        return [];
      }
    },

    async createCollection({ state }, { name }) {
      const collection = {
        id: Date.now().toString(),
        name,
        wallpapers: [],
        created: new Date().toISOString()
      };
      
      state.collections.push(collection);
      localStorage.setItem('collections', JSON.stringify(state.collections));
      return collection;
    },

    async addToCollection({ state }, { collectionId, wallpapers }) {
      const collection = state.collections.find(c => c.id === collectionId);
      if (collection) {
        collection.wallpapers.push(...wallpapers);
        localStorage.setItem('collections', JSON.stringify(state.collections));
      }
    },

    async renameCollection({ state }, { id, name }) {
      const collection = state.collections.find(c => c.id === id);
      if (collection) {
        collection.name = name;
        localStorage.setItem('collections', JSON.stringify(state.collections));
      }
    },

    async deleteCollection({ state }, { id }) {
      state.collections = state.collections.filter(c => c.id !== id);
      localStorage.setItem('collections', JSON.stringify(state.collections));
    }
  }
});

export default store;
