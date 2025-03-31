export interface User {
  id: number;
  email: string;
  displayName?: string;
  initials?: string;
  avatar?: string;
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
  price?: string;
  isReserved: boolean;
  isReceived?: boolean;
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
