import { createStore } from 'framework7';

const PROVIDERS = {
  WALLHAVEN: 'wallhaven',
  UNSPLASH: 'unsplash',
  BING: 'bing',
  ALPHACODERS: 'alphacoders'
};

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY'; // Optional: Add if you have one

const store = createStore({
  state: {
    wallpapers: [],
    loading: false,
    collections: [],
    isBackgroundLoading: false,
  },
  
  actions: {
    async fetchWallpapers({ state }, { page = 1, category = null }) {
      try {
        // First, quickly fetch Wallhaven results
        const wallhavenResults = await fetchWallhavenImages(page, category);
        
        // Start background fetching without waiting
        Promise.allSettled([
          fetchUnsplashImages(page, category),
          fetchBingImages(page, category),
          fetchAlphacodersImages(page, category)
        ]).then(results => {
          const additionalWallpapers = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
            .flat()
            .filter(Boolean);

          if (additionalWallpapers.length > 0) {
            state.wallpapers = [...state.wallpapers, ...additionalWallpapers];
            window.dispatchEvent(new CustomEvent('wallpapersUpdated'));
          }
        });

        return wallhavenResults;

      } catch (error) {
        console.error('Error fetching wallpapers:', error);
        return [];
      }
    },

    async searchWallpapers({ state }, query) {
      try {
        state.loading = true;
        
        // Search across all providers in parallel
        const searchPromises = [
          searchWallhavenImages(query),
          searchUnsplashImages(query),
          searchAlphacodersImages(query)
          // Note: Bing doesn't support search, so we skip it
        ];

        const results = await Promise.allSettled(searchPromises);
        
        // Combine results from all providers
        const combinedResults = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value)
          .flat()
          .filter(Boolean);

        return shuffleArray(combinedResults);
        
      } catch (error) {
        console.error('Search error:', error);
        return [];
      } finally {
        state.loading = false;
      }
    },

    async fetchCollections({ state }) {
      try {
        const collectionsData = localStorage.getItem('collections');
        console.log('Raw collections data:', collectionsData);
        
        if (!collectionsData) {
          state.collections = [];
          return [];
        }
        
        const collections = JSON.parse(collectionsData);
        console.log('Parsed collections:', collections);
        
        // Ensure each collection has required properties
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
      try {
        const collections = state.collections || [];
        const collectionIndex = collections.findIndex(c => c.id === collectionId);
        
        if (collectionIndex === -1) {
          throw new Error('Collection not found');
        }

        // Store the complete wallpaper objects with all necessary data
        const wallpapersToAdd = wallpapers.map(w => ({
          id: w.id,
          title: w.title,
          path: w.path,        // thumbnail URL
          fullUrl: w.fullUrl,  // full resolution URL
          resolution: w.resolution,
          category: w.category,
          views: w.views,
          favorites: w.favorites,
          provider: w.provider
        }));

        // Add new wallpapers to collection
        collections[collectionIndex].wallpapers = [
          ...collections[collectionIndex].wallpapers,
          ...wallpapersToAdd
        ];

        // Remove duplicates based on wallpaper id
        collections[collectionIndex].wallpapers = Array.from(
          new Map(collections[collectionIndex].wallpapers.map(w => [w.id, w])).values()
        );

        // Save to localStorage
        localStorage.setItem('collections', JSON.stringify(collections));
        state.collections = collections;

        return collections[collectionIndex];
      } catch (error) {
        console.error('Error adding to collection:', error);
        throw error;
      }
    },

    async renameCollection({ state }, { id, name }) {
      try {
        const collections = state.collections || [];
        const collectionIndex = collections.findIndex(c => c.id === id);
        
        if (collectionIndex === -1) {
          throw new Error('Collection not found');
        }

        // Update collection name
        collections[collectionIndex].name = name;
        
        // Save to localStorage
        localStorage.setItem('collections', JSON.stringify(collections));
        state.collections = collections;

        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('collectionsUpdated'));
        
        return collections[collectionIndex];
      } catch (error) {
        console.error('Error renaming collection:', error);
        throw error;
      }
    },

    async deleteCollection({ state }, { id }) {
      try {
        const collections = state.collections || [];
        const collectionIndex = collections.findIndex(c => c.id === id);
        
        if (collectionIndex === -1) {
          throw new Error('Collection not found');
        }

        // Remove collection
        collections.splice(collectionIndex, 1);
        
        // Save to localStorage
        localStorage.setItem('collections', JSON.stringify(collections));
        state.collections = collections;

        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('collectionsUpdated'));
        
        return true;
      } catch (error) {
        console.error('Error deleting collection:', error);
        throw error;
      }
    },

    async fetchRandomWallpaper({ state }) {
      try {
        // Try Wallhaven first as it's usually faster
        try {
          const wallhavenResult = await fetchRandomWallhavenImage();
          if (wallhavenResult) return wallhavenResult;
        } catch (error) {
          console.log('Wallhaven random fetch failed, trying Unsplash...');
        }

        // Fallback to Unsplash
        const unsplashResult = await fetchRandomUnsplashImage();
        return unsplashResult;

      } catch (error) {
        console.error('Error fetching random wallpaper:', error);
        throw error;
      }
    },
  }
});

// Helper function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Provider-specific fetch functions
async function fetchWallhavenImages(page, category) {
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

    return data.data.map(wallpaper => ({
      id: wallpaper.id,
      title: `Wallpaper ${wallpaper.id}`,
      path: wallpaper.thumbs.large,
      fullUrl: wallpaper.path,
      resolution: wallpaper.resolution,
      category: wallpaper.category,
      views: wallpaper.views,
      favorites: wallpaper.favorites,
      provider: PROVIDERS.WALLHAVEN,
      loaded: false
    }));
    
  } catch (error) {
    console.error('Error fetching wallpapers:', error);
    return [];
  }
}

async function fetchUnsplashImages(page, category) {
  try {
    const perPage = 24;
    const searchQuery = category ? category : 'wallpaper';
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://unsplash.com/napi/search/photos?query=${searchQuery}&per_page=${perPage}&page=${page}`
    )}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Unsplash fetch failed');
    
    const data = await response.json();
    
    return data.results.map(photo => ({
      id: photo.id,
      title: photo.description || 'Unsplash Wallpaper',
      path: photo.urls.small,
      fullUrl: photo.urls.full,
      resolution: `${photo.width}x${photo.height}`,
      views: photo.views || 0,
      favorites: photo.likes || 0,
      provider: PROVIDERS.UNSPLASH,
      loaded: false,
      fallbackUrls: [photo.urls.regular, photo.urls.small] // Add fallback URLs
    }));
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return [];
  }
}

async function fetchBingImages(page, category) {
  try {
    // If category is specified, skip Bing images as they don't support filtering
    if (category) {
      return [];
    }

    const url = `${CORS_PROXY}${encodeURIComponent(
      // Increase number of images and offset based on page
      `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${(page-1) * 8}&n=8`
    )}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Bing fetch failed');
    
    const data = await response.json();
    
    return data.images.map((image, index) => {
      const baseUrl = 'https://www.bing.com';
      const fullUrl = `${baseUrl}${image.url.split('&rf')[0].replace('1920x1080', 'UHD')}`;
      const thumbnailUrl = `${baseUrl}${image.url.split('&rf')[0]}`;
      
      return {
        id: `bing-${image.startdate}-${index}`,
        title: image.title || 'Bing Wallpaper',
        path: thumbnailUrl,
        fullUrl,
        resolution: 'UHD',
        views: Math.floor(Math.random() * 1000),
        favorites: Math.floor(Math.random() * 100),
        loaded: false,
        fallbackUrls: [thumbnailUrl],
        copyright: image.copyright
      };
    });
  } catch (error) {
    console.error('Bing fetch error:', error);
    return [];
  }
}

async function fetchAlphacodersImages(page, category) {
  try {
    const searchQuery = category ? category : 'wallpaper';
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://wall.alphacoders.com/search.php?search=${searchQuery}&page=${page}`
    )}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Alphacoders fetch failed');
    
    const html = await response.text();
    
    // Extract image data using regex
    const imageRegex = /class="thumb-container-big"[\s\S]*?<img.*?src="(.*?)".*?title="(.*?)"/g;
    const matches = [...html.matchAll(imageRegex)];
    
    return matches.map((match, index) => {
      const [_, thumbnailUrl, title] = match;
      // Convert thumbnail URL to full size URL
      const fullUrl = thumbnailUrl.replace('thumbbig-', '');
      
      return {
        id: `alphacoders-${page}-${index}`,
        title: title || 'Wallpaper',
        path: thumbnailUrl,
        fullUrl,
        resolution: 'HD',
        views: Math.floor(Math.random() * 1000),
        favorites: Math.floor(Math.random() * 100),
        provider: PROVIDERS.ALPHACODERS,
        loaded: false,
        fallbackUrls: [thumbnailUrl]
      };
    });
  } catch (error) {
    console.error('Alphacoders fetch error:', error);
    return [];
  }
}

// Provider-specific search functions
async function searchWallhavenImages(query) {
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(
      `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&page=1`
    )}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Wallhaven search failed');
    
    const data = await response.json();
    
    return data.data.map(wallpaper => ({
      id: wallpaper.id,
      title: `Wallpaper ${wallpaper.id}`,
      path: wallpaper.thumbs.large,
      fullUrl: wallpaper.path,
      resolution: wallpaper.resolution,
      views: wallpaper.views,
      favorites: wallpaper.favorites,
      loaded: false
    }));
  } catch (error) {
    console.error('Wallhaven search error:', error);
    return [];
  }
}

async function searchUnsplashImages(query) {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=24&page=1`
    )}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Unsplash search failed');
    
    const data = await response.json();
    
    return data.results.map(photo => ({
      id: photo.id,
      title: photo.description || 'Unsplash Wallpaper',
      path: photo.urls.small,
      fullUrl: photo.urls.full,
      resolution: `${photo.width}x${photo.height}`,
      views: photo.views || 0,
      favorites: photo.likes || 0,
      loaded: false,
      fallbackUrls: [photo.urls.regular, photo.urls.small]
    }));
  } catch (error) {
    console.error('Unsplash search error:', error);
    return [];
  }
}

async function searchAlphacodersImages(query) {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://wall.alphacoders.com/search.php?search=${encodeURIComponent(query)}`
    )}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Alphacoders search failed');
    
    const html = await response.text();
    
    const imageRegex = /class="thumb-container-big"[\s\S]*?<img.*?src="(.*?)".*?title="(.*?)"/g;
    const matches = [...html.matchAll(imageRegex)];
    
    return matches.map((match, index) => {
      const [_, thumbnailUrl, title] = match;
      const fullUrl = thumbnailUrl.replace('thumbbig-', '');
      
      return {
        id: `alphacoders-search-${index}`,
        title: title || 'Wallpaper',
        path: thumbnailUrl,
        fullUrl,
        resolution: 'HD',
        views: Math.floor(Math.random() * 1000),
        favorites: Math.floor(Math.random() * 100),
        loaded: false,
        fallbackUrls: [thumbnailUrl]
      };
    });
  } catch (error) {
    console.error('Alphacoders search error:', error);
    return [];
  }
}

async function fetchRandomWallhavenImage() {
  try {
    // Get a random page between 1 and 10
    const randomPage = Math.floor(Math.random() * 10) + 1;
    
    const params = new URLSearchParams({
      page: randomPage.toString(),
      categories: '111',
      purity: '100',
      sorting: 'random',
      atleast: '1920x1080',
      ratios: '16x9,16x10'
    });

    const url = `https://wallhaven.cc/api/v1/search?${params.toString()}`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    
    if (!response.ok) throw new Error('Wallhaven random fetch failed');
    
    const data = await response.json();
    
    // Get a random wallpaper from the results
    const randomIndex = Math.floor(Math.random() * data.data.length);
    const wallpaper = data.data[randomIndex];
    
    return {
      id: wallpaper.id,
      title: `Wallpaper ${wallpaper.id}`,
      path: wallpaper.thumbs.large, // Use thumbnail for preview
      fullUrl: wallpaper.path, // Full resolution URL
      resolution: wallpaper.resolution,
      category: wallpaper.category,
      views: wallpaper.views,
      favorites: wallpaper.favorites,
      provider: PROVIDERS.WALLHAVEN,
      loaded: false,
      fallbackUrls: [wallpaper.thumbs.large, wallpaper.thumbs.original] // Add fallbacks
    };
  } catch (error) {
    console.error('Random Wallhaven fetch error:', error);
    throw error;
  }
}

async function fetchRandomUnsplashImage() {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(
      'https://unsplash.com/napi/photos/random?orientation=landscape&count=1'
    )}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Unsplash random fetch failed');
    
    const photo = await response.json();
    
    return {
      id: photo.id,
      title: photo.description || 'Unsplash Wallpaper',
      path: photo.urls.regular, // Use regular size for better initial load
      fullUrl: photo.urls.full,
      resolution: `${photo.width}x${photo.height}`,
      views: photo.views || 0,
      favorites: photo.likes || 0,
      provider: PROVIDERS.UNSPLASH,
      loaded: false,
      fallbackUrls: [photo.urls.regular, photo.urls.small]
    };
  } catch (error) {
    console.error('Random Unsplash fetch error:', error);
    throw error;
  }
}

async function fetchRandomAlphacodersImage() {
  try {
    // Get a random page between 1 and 10
    const randomPage = Math.floor(Math.random() * 10) + 1;
    
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://wall.alphacoders.com/featured.php?page=${randomPage}`
    )}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Alphacoders random fetch failed');
    
    const html = await response.text();
    
    // Extract image data using regex
    const imageRegex = /class="thumb-container-big"[\s\S]*?<img.*?src="(.*?)".*?title="(.*?)"/g;
    const matches = [...html.matchAll(imageRegex)];
    
    // Get a random wallpaper from the results
    const randomIndex = Math.floor(Math.random() * matches.length);
    const [_, thumbnailUrl, title] = matches[randomIndex];
    
    // Convert thumbnail URL to full size URL
    const fullUrl = thumbnailUrl.replace('thumbbig-', '');
    
    return {
      id: `alphacoders-random-${randomIndex}`,
      title: title || 'Wallpaper',
      path: thumbnailUrl, // Use thumbnail for preview
      fullUrl: fullUrl,
      resolution: 'HD',
      views: Math.floor(Math.random() * 1000),
      favorites: Math.floor(Math.random() * 100),
      provider: PROVIDERS.ALPHACODERS,
      loaded: false,
      fallbackUrls: [thumbnailUrl, fullUrl]
    };
  } catch (error) {
    console.error('Random Alphacoders fetch error:', error);
    throw error;
  }
}

export default store;
