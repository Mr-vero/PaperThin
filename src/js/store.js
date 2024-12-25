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
  },
  
  actions: {
    async fetchWallpapers({ state }, { page = 1, category = null }) {
      try {
        // Fetch from multiple providers in parallel
        const providerPromises = [
          fetchWallhavenImages(page, category),
          fetchUnsplashImages(page, category),
          fetchBingImages(page, category),
          fetchAlphacodersImages(page, category)
        ];

        // Use Promise.allSettled instead of Promise.all to handle partial failures
        const results = await Promise.allSettled(providerPromises);
        
        // Filter successful results and flatten
        const combinedWallpapers = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value)
          .flat()
          .filter(Boolean); // Remove any null/undefined items

        // Shuffle array to mix providers
        return shuffleArray(combinedWallpapers);

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

export default store;
