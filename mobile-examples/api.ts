// API client for WataWan React Native
import { Platform } from 'react-native';

// Configuration
const API_BASE_URL = Platform.select({
  web: 'http://localhost:5000', // Development web
  default: 'https://app.watawan.com', // Production mobile
});

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Important for session cookies
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error');
  }
}

// Specific API functions for WataWan
export const api = {
  // Authentication
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/api/login', { method: 'POST', body: credentials }),

  register: (userData: { email: string; password: string; displayName: string }) =>
    apiRequest('/api/register', { method: 'POST', body: userData }),

  logout: () =>
    apiRequest('/api/logout', { method: 'POST' }),

  getUser: () =>
    apiRequest('/api/user'),

  // Wishlists
  getWishlists: () =>
    apiRequest('/api/wishlist'),

  getWishlistItems: (wishlistId: number) =>
    apiRequest(`/api/wishlist/${wishlistId}/items`),

  addWishlistItem: (wishlistId: number, url: string) =>
    apiRequest(`/api/wishlist/${wishlistId}/items`, {
      method: 'POST',
      body: { url },
    }),

  updateWishlistItem: (itemId: number, updates: any) =>
    apiRequest(`/api/wishlist/items/${itemId}`, {
      method: 'PUT',
      body: updates,
    }),

  deleteWishlistItem: (itemId: number) =>
    apiRequest(`/api/wishlist/items/${itemId}`, { method: 'DELETE' }),

  // Reservations
  getReservedItems: () =>
    apiRequest('/api/reserved-items'),

  unreserveItem: (itemId: number) =>
    apiRequest(`/api/wishlist/items/${itemId}/unreserve`, { method: 'POST' }),

  markItemReceived: (itemId: number) =>
    apiRequest(`/api/wishlist/items/${itemId}/received`, { method: 'POST' }),

  // Notifications
  getUnreadNotifications: () =>
    apiRequest('/api/notifications/unread'),

  markNotificationsRead: () =>
    apiRequest('/api/notifications/mark-read', { method: 'POST' }),

  // Metadata extraction
  extractMetadata: (url: string) =>
    apiRequest(`/api/extract-metadata?url=${encodeURIComponent(url)}`),
};