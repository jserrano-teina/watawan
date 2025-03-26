import { 
  User, InsertUser, 
  Wishlist, InsertWishlist, 
  WishItem, InsertWishItem, 
  Reservation, InsertReservation
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateLastLogin(id: number): Promise<User>;

  // Wishlist operations
  getWishlist(id: number): Promise<Wishlist | undefined>;
  getWishlistByShareableLink(link: string): Promise<Wishlist | undefined>;
  getUserWishlists(userId: number): Promise<Wishlist[]>;
  createWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  
  // WishItem operations
  getWishItemsForWishlist(wishlistId: number): Promise<WishItem[]>;
  getWishItem(id: number): Promise<WishItem | undefined>;
  createWishItem(item: InsertWishItem): Promise<WishItem>;
  updateWishItem(id: number, item: Partial<WishItem>): Promise<WishItem>;
  deleteWishItem(id: number): Promise<boolean>;
  
  // Reservation operations
  reserveWishItem(wishItemId: number, reserverName?: string): Promise<Reservation>;
  getReservationsForUser(userId: number): Promise<{item: WishItem, reservation: Reservation}[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private wishlists: Map<number, Wishlist>;
  private wishItems: Map<number, WishItem>;
  private reservations: Map<number, Reservation>;
  
  currentUserId: number;
  currentWishlistId: number;
  currentWishItemId: number;
  currentReservationId: number;

  constructor() {
    this.users = new Map();
    this.wishlists = new Map();
    this.wishItems = new Map();
    this.reservations = new Map();
    
    this.currentUserId = 1;
    this.currentWishlistId = 1;
    this.currentWishItemId = 1;
    this.currentReservationId = 1;
    
    // Create a default user
    this.createUser({
      email: "demo@example.com",
      password: "password",
      displayName: "Demo User",
      initials: "DU"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    
    // Create user
    // Aseguramos que los campos opcionales sean string o undefined, nunca null
    const displayName = insertUser.displayName || undefined;
    const initials = insertUser.initials || undefined;
    const avatar = insertUser.avatar || undefined;
    
    const user: User = { 
      ...insertUser, 
      id,
      displayName,
      initials,
      avatar,
      createdAt: now,
      lastLogin: now,
      settings: {}
    };
    
    this.users.set(id, user);
    
    // Create default wishlist for the user
    const shareableLink = nanoid(10);
    const wishlist: Wishlist = {
      id: this.currentWishlistId++,
      userId: id,
      shareableLink,
      createdAt: now,
    };
    this.wishlists.set(wishlist.id, wishlist);
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateLastLogin(id: number): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { 
      ...existingUser, 
      lastLogin: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Wishlist operations
  async getWishlist(id: number): Promise<Wishlist | undefined> {
    return this.wishlists.get(id);
  }

  async getWishlistByShareableLink(link: string): Promise<Wishlist | undefined> {
    return Array.from(this.wishlists.values()).find(
      (wishlist) => wishlist.shareableLink === link
    );
  }

  async getUserWishlists(userId: number): Promise<Wishlist[]> {
    return Array.from(this.wishlists.values()).filter(
      (wishlist) => wishlist.userId === userId
    );
  }

  async createWishlist(wishlist: InsertWishlist): Promise<Wishlist> {
    const id = this.currentWishlistId++;
    const newWishlist: Wishlist = { 
      ...wishlist, 
      id,
      createdAt: new Date(),
    };
    this.wishlists.set(id, newWishlist);
    return newWishlist;
  }

  // WishItem operations
  async getWishItemsForWishlist(wishlistId: number): Promise<WishItem[]> {
    return Array.from(this.wishItems.values()).filter(
      (item) => item.wishlistId === wishlistId
    );
  }

  async getWishItem(id: number): Promise<WishItem | undefined> {
    return this.wishItems.get(id);
  }

  async createWishItem(item: InsertWishItem): Promise<WishItem> {
    const id = this.currentWishItemId++;
    
    // Aseguramos que los campos opcionales sean string o undefined, nunca null
    const description = item.description || undefined;
    const imageUrl = item.imageUrl || undefined;
    const price = item.price || undefined;
    
    const newItem: WishItem = { 
      ...item, 
      id,
      description,
      imageUrl,
      price,
      isReserved: false,
      createdAt: new Date(),
    };
    this.wishItems.set(id, newItem);
    return newItem;
  }

  async updateWishItem(id: number, itemUpdate: Partial<WishItem>): Promise<WishItem> {
    const existingItem = this.wishItems.get(id);
    if (!existingItem) {
      throw new Error(`Wish item with ID ${id} not found`);
    }
    
    const updatedItem = { ...existingItem, ...itemUpdate };
    this.wishItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteWishItem(id: number): Promise<boolean> {
    const existingReservation = Array.from(this.reservations.values()).find(
      (reservation) => reservation.wishItemId === id
    );
    
    // Delete any associated reservation
    if (existingReservation) {
      this.reservations.delete(existingReservation.id);
    }
    
    return this.wishItems.delete(id);
  }

  // Reservation operations
  async reserveWishItem(wishItemId: number, reserverName?: string): Promise<Reservation> {
    const wishItem = await this.getWishItem(wishItemId);
    if (!wishItem) {
      throw new Error(`Wish item with ID ${wishItemId} not found`);
    }
    
    if (wishItem.isReserved) {
      throw new Error("This item is already reserved");
    }
    
    // Update wish item to reserved status
    await this.updateWishItem(wishItemId, { 
      isReserved: true,
      reserverName,
    });
    
    // Create reservation
    const id = this.currentReservationId++;
    const reservation: Reservation = {
      id,
      wishItemId,
      reserverName, // Puede ser undefined, lo cual es válido para el tipo text
      reservedAt: new Date(),
    };
    this.reservations.set(id, reservation);
    
    return reservation;
  }

  async getReservationsForUser(userId: number): Promise<{item: WishItem, reservation: Reservation}[]> {
    // Get all user's wishlists
    const userWishlists = await this.getUserWishlists(userId);
    const wishlistIds = userWishlists.map(wl => wl.id);
    
    // Find all wish items from these wishlists that are reserved
    const reservedItems = Array.from(this.wishItems.values()).filter(
      item => wishlistIds.includes(item.wishlistId) && item.isReserved
    );
    
    // Get the corresponding reservations
    const result: {item: WishItem, reservation: Reservation}[] = [];
    for (const item of reservedItems) {
      const reservation = Array.from(this.reservations.values()).find(
        r => r.wishItemId === item.id
      );
      if (reservation) {
        result.push({ item, reservation });
      }
    }
    
    return result;
  }
}

export const storage = new MemStorage();
