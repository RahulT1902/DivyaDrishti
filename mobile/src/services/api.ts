import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let dynamicBaseUrl = '';

export const getApiUrl = async () => {
  if (dynamicBaseUrl) {
    return dynamicBaseUrl;
  }
  
  const savedUrl = await AsyncStorage.getItem('divya:apiUrl');
  if (savedUrl) {
    dynamicBaseUrl = savedUrl;
    return dynamicBaseUrl;
  }
  
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001';
    }
    return 'http://localhost:3001';
  }
  
  // Production cloud backend hosted on Vercel
  return 'https://divya-drishti-eight.vercel.app';
};

export const setApiUrl = async (url: string) => {
  let cleanUrl = url.trim();
  if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `http://${cleanUrl}`;
  }
  dynamicBaseUrl = cleanUrl;
  if (cleanUrl) {
    await AsyncStorage.setItem('divya:apiUrl', cleanUrl);
  } else {
    await AsyncStorage.removeItem('divya:apiUrl');
  }
};

// ─── Cache Layer ────────────────────────────────────────────────────────────

/** Default time-to-live for cached responses: 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_PREFIX = 'divya:cache:';

interface CacheEntry<T = any> {
  data: T;
  cachedAt: number;
  ttl: number;
}

/** Build a stable cache key from an endpoint + query params object */
export const buildCacheKey = (endpoint: string, params?: Record<string, string>): string => {
  if (!params || Object.keys(params).length === 0) {
    return `${CACHE_PREFIX}${endpoint}`;
  }
  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${CACHE_PREFIX}${endpoint}?${sorted}`;
};

/** Store a response in the cache with a TTL. */
export const storeCache = async <T>(key: string, data: T, ttl = CACHE_TTL_MS): Promise<void> => {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttl };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Cache writes should never crash the app
  }
};

/** Retrieve a cache entry if it exists and has not expired. Returns null if missing/stale. */
export const retrieveCache = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > entry.ttl) {
      // Stale — remove silently
      AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
};

/** Manually invalidate one or more cache entries by key prefix. */
export const invalidateCache = async (endpointPrefix: string): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const matchingKeys = allKeys.filter(k => k.startsWith(`${CACHE_PREFIX}${endpointPrefix}`));
    if (matchingKeys.length > 0) {
      await AsyncStorage.multiRemove(matchingKeys);
    }
  } catch {
    // Silent failure
  }
};

// ─── Request Layer ───────────────────────────────────────────────────────────

export type CachePolicy =
  /** Return cache immediately if fresh; fetch in background to update cache. */
  | 'cache-first'
  /** Always fetch from network; update cache on success. */
  | 'network-first'
  /** Always fetch, never cache. (default for POST/PUT/DELETE) */
  | 'no-cache';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  /** How to handle caching for this request. Defaults to 'no-cache'. */
  cachePolicy?: CachePolicy;
  /** If true, bypass the cache read and force a fresh network request. Cache is still updated. */
  skipCache?: boolean;
  /** Override the default TTL (ms) for this request's cache entry. */
  cacheTtl?: number;
}

export const api = {
  async request(endpoint: string, options: RequestOptions = {}) {
    const method = options.method || 'GET';
    const defaultPolicy = method === 'GET' ? 'network-first' : 'no-cache';

    const {
      params,
      cachePolicy = defaultPolicy,
      skipCache = false,
      cacheTtl = CACHE_TTL_MS,
      ...fetchOptions
    } = options;

    const baseUrl = await getApiUrl();
    const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, baseUrl);

    // Add query parameters if present
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        url.searchParams.append(key, val);
      });
    }

    const headers = new Headers(fetchOptions.headers);
    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Inject auth: prefer JWT bearer token; fall back to email header for
    // requests made before the user has logged in with the new flow.
    const token = await AsyncStorage.getItem('divya:token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (email) headers.set('x-user-email', email);
    }

    // ── Cache-first: return stale data immediately, then revalidate ──
    const cacheKey = buildCacheKey(endpoint, params);

    if (cachePolicy === 'cache-first' && !skipCache) {
      const cached = await retrieveCache(cacheKey);
      if (cached !== null) {
        // Kick off a background revalidation so next call gets fresh data
        this._fetchAndCache(url.toString(), fetchOptions, headers, cacheKey, cacheTtl).catch(() => {});
        return cached;
      }
      // Cache miss — fall through to network
    }

    // ── Network request ──────────────────────────────────────────────
    try {
      const data = await this._fetchAndCache(url.toString(), fetchOptions, headers, cachePolicy !== 'no-cache' ? cacheKey : null, cacheTtl);
      return data;
    } catch (error) {
      if (cachePolicy === 'network-first' && !skipCache) {
        const cached = await retrieveCache(cacheKey);
        if (cached !== null) {
          return cached;
        }
      }
      throw error;
    }
  },

  /** Internal: fetch, check response, optionally persist to cache, return JSON. */
  async _fetchAndCache(
    urlString: string,
    fetchOptions: RequestInit,
    headers: Headers,
    cacheKey: string | null,
    cacheTtl: number,
  ) {
    const response = await fetch(urlString, { ...fetchOptions, headers });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Network request failed' };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (cacheKey) {
      storeCache(cacheKey, json, cacheTtl).catch(() => {});
    }

    return json;
  },

  get(endpoint: string, params?: Record<string, string>, options: Omit<RequestOptions, 'method' | 'params'> = {}) {
    return this.request(endpoint, { ...options, method: 'GET', params });
  },

  /** Cached GET — returns stale data instantly then refreshes in background. */
  getCached(
    endpoint: string,
    params?: Record<string, string>,
    options: Omit<RequestOptions, 'method' | 'params' | 'cachePolicy'> = {},
  ) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
      params,
      cachePolicy: 'cache-first',
    });
  },

  /** Force a fresh network fetch, bypassing the cache (e.g., on pull-to-refresh). */
  getForce(endpoint: string, params?: Record<string, string>, options: Omit<RequestOptions, 'method' | 'params'> = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
      params,
      cachePolicy: 'cache-first',
      skipCache: true,
    });
  },

  post(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};
