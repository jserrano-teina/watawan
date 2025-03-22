export interface User {
  id: number;
  username: string;
  displayName?: string;
  initials?: string;
}

export interface Wishlist {
  id: number;
  userId: number;
  shareableLink: string;
  createdAt: string;
}

export interface WishItem {
  id: number;
  wishlistId: number;
  title: string;
  description?: string;
  purchaseLink: string;
  imageUrl?: string;
  isReserved: boolean;
  reservedBy?: string;
  reserverName?: string;
  createdAt: string;
}

export interface Reservation {
  id: number;
  wishItemId: number;
  reserverName?: string;
  reservedAt: string;
}

export interface SharedWishlistData {
  wishlist: Wishlist;
  owner: User;
}
