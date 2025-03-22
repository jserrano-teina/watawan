import { 
  users, type User, type InsertUser,
  wishlists, type Wishlist, type InsertWishlist,
  wishlistItems, type WishlistItem, type InsertWishlistItem,
  reservations, type Reservation, type InsertReservation
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wishlist methods
  createWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  getWishlist(id: number): Promise<Wishlist | undefined>;
  getWishlistByShareableId(shareableId: string): Promise<Wishlist | undefined>;
  updateWishlist(id: number, wishlist: Partial<InsertWishlist>): Promise<Wishlist>;
  deleteWishlist(id: number): Promise<boolean>;
  getWishlistsByUserId(userId: number): Promise<Wishlist[]>;
  
  // Wishlist item methods
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  getWishlistItem(id: number): Promise<WishlistItem | undefined>;
  updateWishlistItem(id: number, item: Partial<InsertWishlistItem>): Promise<WishlistItem>;
  deleteWishlistItem(id: number): Promise<boolean>;
  getWishlistItemsByWishlistId(wishlistId: number): Promise<WishlistItem[]>;
  
  // Reservation methods
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservation(id: number): Promise<Reservation | undefined>;
  getReservationByItemId(itemId: number): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  getReservationsByVisitorId(visitorId: string): Promise<Reservation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private wishlists: Map<number, Wishlist>;
  private wishlistItems: Map<number, WishlistItem>;
  private reservations: Map<number, Reservation>;
  
  private userId: number;
  private wishlistId: number;
  private wishlistItemId: number;
  private reservationId: number;

  constructor() {
    this.users = new Map();
    this.wishlists = new Map();
    this.wishlistItems = new Map();
    this.reservations = new Map();
    
    this.userId = 1;
    this.wishlistId = 1;
    this.wishlistItemId = 1;
    this.reservationId = 1;
    
    // Create a default user
    this.createUser({
      username: "demo",
      password: "demo123"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Wishlist methods
  async createWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    const id = this.wishlistId++;
    const now = new Date();
    const wishlist: Wishlist = { 
      ...insertWishlist, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.wishlists.set(id, wishlist);
    return wishlist;
  }
  
  async getWishlist(id: number): Promise<Wishlist | undefined> {
    return this.wishlists.get(id);
  }
  
  async getWishlistByShareableId(shareableId: string): Promise<Wishlist | undefined> {
    return Array.from(this.wishlists.values()).find(
      (wishlist) => wishlist.shareableId === shareableId,
    );
  }
  
  async updateWishlist(id: number, wishlistUpdate: Partial<InsertWishlist>): Promise<Wishlist> {
    const wishlist = this.wishlists.get(id);
    if (!wishlist) {
      throw new Error(`Wishlist with id ${id} not found`);
    }
    
    const updatedWishlist: Wishlist = {
      ...wishlist,
      ...wishlistUpdate,
      updatedAt: new Date()
    };
    
    this.wishlists.set(id, updatedWishlist);
    return updatedWishlist;
  }
  
  async deleteWishlist(id: number): Promise<boolean> {
    // First delete all items in the wishlist
    const items = await this.getWishlistItemsByWishlistId(id);
    for (const item of items) {
      await this.deleteWishlistItem(item.id);
    }
    
    return this.wishlists.delete(id);
  }
  
  async getWishlistsByUserId(userId: number): Promise<Wishlist[]> {
    return Array.from(this.wishlists.values()).filter(
      (wishlist) => wishlist.userId === userId,
    );
  }
  
  // Wishlist item methods
  async createWishlistItem(insertItem: InsertWishlistItem): Promise<WishlistItem> {
    const id = this.wishlistItemId++;
    const now = new Date();
    const item: WishlistItem = {
      ...insertItem,
      id,
      createdAt: now
    };
    this.wishlistItems.set(id, item);
    
    // Update the wishlist's updatedAt time
    const wishlist = this.wishlists.get(insertItem.wishlistId);
    if (wishlist) {
      wishlist.updatedAt = now;
      this.wishlists.set(wishlist.id, wishlist);
    }
    
    return item;
  }
  
  async getWishlistItem(id: number): Promise<WishlistItem | undefined> {
    return this.wishlistItems.get(id);
  }
  
  async updateWishlistItem(id: number, itemUpdate: Partial<InsertWishlistItem>): Promise<WishlistItem> {
    const item = this.wishlistItems.get(id);
    if (!item) {
      throw new Error(`Wishlist item with id ${id} not found`);
    }
    
    const updatedItem: WishlistItem = {
      ...item,
      ...itemUpdate
    };
    
    this.wishlistItems.set(id, updatedItem);
    
    // Update the wishlist's updatedAt time
    const wishlist = this.wishlists.get(item.wishlistId);
    if (wishlist) {
      wishlist.updatedAt = new Date();
      this.wishlists.set(wishlist.id, wishlist);
    }
    
    return updatedItem;
  }
  
  async deleteWishlistItem(id: number): Promise<boolean> {
    // First check if there's a reservation for this item
    const item = this.wishlistItems.get(id);
    if (item) {
      // Delete any reservations for this item
      const reservation = await this.getReservationByItemId(id);
      if (reservation) {
        await this.deleteReservation(reservation.id);
      }
      
      // Update the wishlist's updatedAt time
      const wishlist = this.wishlists.get(item.wishlistId);
      if (wishlist) {
        wishlist.updatedAt = new Date();
        this.wishlists.set(wishlist.id, wishlist);
      }
    }
    
    return this.wishlistItems.delete(id);
  }
  
  async getWishlistItemsByWishlistId(wishlistId: number): Promise<WishlistItem[]> {
    return Array.from(this.wishlistItems.values()).filter(
      (item) => item.wishlistId === wishlistId,
    );
  }
  
  // Reservation methods
  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    // Check if item already has a reservation
    const existingReservation = await this.getReservationByItemId(insertReservation.itemId);
    if (existingReservation) {
      throw new Error(`Item with id ${insertReservation.itemId} is already reserved`);
    }
    
    const id = this.reservationId++;
    const now = new Date();
    const reservation: Reservation = {
      ...insertReservation,
      id,
      reservedAt: now
    };
    
    this.reservations.set(id, reservation);
    return reservation;
  }
  
  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }
  
  async getReservationByItemId(itemId: number): Promise<Reservation | undefined> {
    return Array.from(this.reservations.values()).find(
      (reservation) => reservation.itemId === itemId,
    );
  }
  
  async deleteReservation(id: number): Promise<boolean> {
    return this.reservations.delete(id);
  }
  
  async getReservationsByVisitorId(visitorId: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (reservation) => reservation.visitorId === visitorId,
    );
  }
}

export const storage = new MemStorage();
