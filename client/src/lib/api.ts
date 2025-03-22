import { apiRequest, queryClient } from "./queryClient";
import { 
  type Wishlist, 
  type WishlistItem, 
  type InsertWishlist, 
  type InsertWishlistItem,
  type Reservation,
  type InsertReservation
} from "@shared/schema";

// Generate a unique visitor ID for the current session
export const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
};

// Wishlist API
export const fetchWishlists = async (): Promise<Wishlist[]> => {
  const res = await apiRequest('GET', '/api/wishlists');
  return res.json();
};

export const fetchWishlistDetail = async (id: number): Promise<Wishlist> => {
  const res = await apiRequest('GET', `/api/wishlists/${id}`);
  return res.json();
};

export const createWishlist = async (wishlist: Omit<InsertWishlist, 'userId' | 'shareableId'>): Promise<Wishlist> => {
  const res = await apiRequest('POST', '/api/wishlists', wishlist);
  queryClient.invalidateQueries({ queryKey: ['/api/wishlists'] });
  return res.json();
};

export const updateWishlist = async (id: number, wishlist: Partial<InsertWishlist>): Promise<Wishlist> => {
  const res = await apiRequest('PUT', `/api/wishlists/${id}`, wishlist);
  queryClient.invalidateQueries({ queryKey: ['/api/wishlists'] });
  queryClient.invalidateQueries({ queryKey: [`/api/wishlists/${id}`] });
  return res.json();
};

export const deleteWishlist = async (id: number): Promise<void> => {
  await apiRequest('DELETE', `/api/wishlists/${id}`);
  queryClient.invalidateQueries({ queryKey: ['/api/wishlists'] });
};

// Wishlist Item API
export const createWishlistItem = async (item: InsertWishlistItem): Promise<WishlistItem> => {
  const res = await apiRequest('POST', '/api/wishlistItems', item);
  queryClient.invalidateQueries({ queryKey: [`/api/wishlists/${item.wishlistId}`] });
  queryClient.invalidateQueries({ queryKey: ['/api/wishlists'] });
  return res.json();
};

export const updateWishlistItem = async (id: number, item: Partial<InsertWishlistItem>): Promise<WishlistItem> => {
  const res = await apiRequest('PUT', `/api/wishlistItems/${id}`, item);
  
  // Find the wishlist this item belongs to
  const response = await apiRequest('GET', `/api/wishlistItems/${id}`);
  const updatedItem: WishlistItem = await response.json();
  
  queryClient.invalidateQueries({ queryKey: [`/api/wishlists/${updatedItem.wishlistId}`] });
  queryClient.invalidateQueries({ queryKey: ['/api/wishlists'] });
  return res.json();
};

export const deleteWishlistItem = async (id: number, wishlistId: number): Promise<void> => {
  await apiRequest('DELETE', `/api/wishlistItems/${id}`);
  queryClient.invalidateQueries({ queryKey: [`/api/wishlists/${wishlistId}`] });
  queryClient.invalidateQueries({ queryKey: ['/api/wishlists'] });
};

// Shared Wishlist API
export const fetchSharedWishlist = async (shareableId: string): Promise<Wishlist> => {
  const visitorId = getVisitorId();
  const res = await apiRequest('GET', `/api/shared/${shareableId}?visitorId=${visitorId}`);
  return res.json();
};

// Reservation API
export const createReservation = async (reservation: Omit<InsertReservation, 'visitorId'>): Promise<Reservation> => {
  const visitorId = getVisitorId();
  const res = await apiRequest('POST', '/api/reservations', {
    ...reservation,
    visitorId
  });
  
  // Invalidate the shared wishlist cache
  queryClient.invalidateQueries({ queryKey: ['/api/shared'] });
  return res.json();
};

export const cancelReservation = async (itemId: number): Promise<void> => {
  const visitorId = getVisitorId();
  await apiRequest('DELETE', `/api/reservations/item/${itemId}?visitorId=${visitorId}`);
  
  // Invalidate the shared wishlist cache
  queryClient.invalidateQueries({ queryKey: ['/api/shared'] });
};

export const releaseReservation = async (id: number): Promise<void> => {
  await apiRequest('DELETE', `/api/reservations/${id}`);
  queryClient.invalidateQueries({ queryKey: ['/api/wishlists'] });
};
