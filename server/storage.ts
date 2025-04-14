import { 
  User, InsertUser, 
  Wishlist, InsertWishlist, 
  WishItem, InsertWishItem, 
  Reservation, InsertReservation,
  users, wishlists, wishItems, reservations
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, desc, sql, asc, lt, gt } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateLastLogin(id: number): Promise<User>;
  updateLastNotificationsView(id: number): Promise<User>;

  // Wishlist operations
  getWishlist(id: number): Promise<Wishlist | undefined>;
  getWishlistByShareableLink(link: string): Promise<Wishlist | undefined>;
  getUserWishlists(userId: number): Promise<Wishlist[]>;
  createWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  
  // WishItem operations
  getWishItemsForWishlist(wishlistId: number, includeReceived?: boolean): Promise<WishItem[]>;
  getWishItem(id: number): Promise<WishItem | undefined>;
  createWishItem(item: InsertWishItem): Promise<WishItem>;
  updateWishItem(id: number, item: Partial<WishItem>): Promise<WishItem>;
  deleteWishItem(id: number): Promise<boolean>;
  markWishItemAsReceived(id: number): Promise<WishItem>;
  
  // Reservation operations
  reserveWishItem(wishItemId: number, reserverName?: string): Promise<Reservation>;
  unreserveWishItem(wishItemId: number): Promise<WishItem>;
  getReservationsForUser(userId: number): Promise<{item: WishItem, reservation: Reservation}[]>;
  getUnreadReservationsForUser(userId: number): Promise<{item: WishItem, reservation: Reservation}[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Configurar el store de sesiones con PostgreSQL
    const PostgresSessionStore = connectPgSimple(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Crear el usuario
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Crear wishlist por defecto para el usuario
    const shareableLink = nanoid(10);
    const [wishlist] = await db.insert(wishlists).values({
      userId: user.id,
      shareableLink
    }).returning();
    
    console.log(`Wishlist creada para usuario ${user.id}: ${wishlist.id} con link ${wishlist.shareableLink}`);
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
      
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async updateLastLogin(id: number): Promise<User> {
    return this.updateUser(id, { lastLogin: new Date() });
  }
  
  async updateLastNotificationsView(id: number): Promise<User> {
    return this.updateUser(id, { lastNotificationsView: new Date() });
  }

  // Wishlist operations
  async getWishlist(id: number): Promise<Wishlist | undefined> {
    const result = await db.select().from(wishlists).where(eq(wishlists.id, id));
    return result.length ? result[0] : undefined;
  }

  async getWishlistByShareableLink(link: string): Promise<Wishlist | undefined> {
    const result = await db.select().from(wishlists).where(eq(wishlists.shareableLink, link));
    return result.length ? result[0] : undefined;
  }

  async getUserWishlists(userId: number): Promise<Wishlist[]> {
    const userWishlists = await db.select().from(wishlists).where(eq(wishlists.userId, userId));
    
    // Si no se encuentra ninguna wishlist para el usuario, crear una por defecto
    if (userWishlists.length === 0) {
      console.log(`No se encontraron wishlists para el usuario ${userId}. Creando una por defecto.`);
      const shareableLink = nanoid(10);
      const [newWishlist] = await db.insert(wishlists).values({
        userId,
        shareableLink
      }).returning();
      
      console.log(`Wishlist creada para usuario ${userId}: ${newWishlist.id} con link ${newWishlist.shareableLink}`);
      return [newWishlist];
    }
    
    return userWishlists;
  }

  async createWishlist(wishlist: InsertWishlist): Promise<Wishlist> {
    const [newWishlist] = await db.insert(wishlists).values(wishlist).returning();
    return newWishlist;
  }

  // WishItem operations
  async getWishItemsForWishlist(wishlistId: number, includeReceived: boolean = false): Promise<WishItem[]> {
    // Construir la consulta base
    let items: WishItem[] = [];
    
    if (includeReceived) {
      items = await db.select().from(wishItems).where(eq(wishItems.wishlistId, wishlistId));
    } else {
      items = await db.select().from(wishItems)
        .where(and(
          eq(wishItems.wishlistId, wishlistId),
          eq(wishItems.isReceived, false)
        ));
    }
    
    // Ordenar según los criterios:
    // 1. Primero los no recibidos
    // 2. Dentro de cada grupo, ordenar por fecha de creación (más recientes primero)
    return items.sort((a, b) => {
      // Primero ordenar por recibido/no recibido
      if (a.isReceived !== b.isReceived) {
        return a.isReceived ? 1 : -1; // No recibidos primero
      }
      
      // Luego por fecha de creación (más recientes primero)
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }

  async getWishItem(id: number): Promise<WishItem | undefined> {
    const result = await db.select().from(wishItems).where(eq(wishItems.id, id));
    return result.length ? result[0] : undefined;
  }

  async createWishItem(item: InsertWishItem): Promise<WishItem> {
    const [newItem] = await db.insert(wishItems).values({
      ...item,
      isReserved: false,
      isReceived: false
    }).returning();
    
    return newItem;
  }

  async updateWishItem(id: number, itemUpdate: Partial<WishItem>): Promise<WishItem> {
    const [updatedItem] = await db
      .update(wishItems)
      .set(itemUpdate)
      .where(eq(wishItems.id, id))
      .returning();
      
    if (!updatedItem) {
      throw new Error(`Wish item with ID ${id} not found`);
    }
    
    return updatedItem;
  }

  async deleteWishItem(id: number): Promise<boolean> {
    // Las restricciones de clave foránea se encargarán de eliminar las reservas asociadas
    const result = await db.delete(wishItems).where(eq(wishItems.id, id)).returning();
    return result.length > 0;
  }
  
  async markWishItemAsReceived(id: number): Promise<WishItem> {
    return this.updateWishItem(id, { isReceived: true });
  }

  // Reservation operations
  async reserveWishItem(wishItemId: number, reserverName?: string): Promise<Reservation> {
    // Verificar si el item existe y no está reservado
    const item = await this.getWishItem(wishItemId);
    if (!item) {
      throw new Error(`Wish item with ID ${wishItemId} not found`);
    }
    
    if (item.isReserved) {
      throw new Error("This item is already reserved");
    }
    
    // Actualizar el item como reservado
    await this.updateWishItem(wishItemId, { 
      isReserved: true,
      reserverName 
    });
    
    // Crear la reserva
    const [reservation] = await db.insert(reservations).values({
      wishItemId,
      reserverName
    }).returning();
    
    return reservation;
  }

  async unreserveWishItem(wishItemId: number): Promise<WishItem> {
    // Verificar si el item existe y está reservado
    const item = await this.getWishItem(wishItemId);
    if (!item) {
      throw new Error(`Wish item with ID ${wishItemId} not found`);
    }
    
    if (!item.isReserved) {
      throw new Error("This item is not reserved");
    }
    
    // Eliminar la reserva existente (las cascadas se ocuparán de esto)
    await db.delete(reservations).where(eq(reservations.wishItemId, wishItemId));
    
    // Actualizar el item para quitar la reserva
    const updatedItem = await this.updateWishItem(wishItemId, { 
      isReserved: false,
      reserverName: null 
    });
    
    return updatedItem;
  }

  async getReservationsForUser(userId: number): Promise<{item: WishItem, reservation: Reservation}[]> {
    // Obtenemos todos los wishlists del usuario
    const userWishlists = await this.getUserWishlists(userId);
    const wishlistIds = userWishlists.map(wl => wl.id);
    
    if (wishlistIds.length === 0) {
      return [];
    }
    
    // Consulta compleja para obtener los items reservados y sus reservas
    const result = await db
      .select({
        item: wishItems,
        reservation: reservations
      })
      .from(wishItems)
      .innerJoin(reservations, eq(wishItems.id, reservations.wishItemId))
      .where(
        and(
          sql`${wishItems.wishlistId} IN (${sql.join(wishlistIds, sql`, `)})`,
          eq(wishItems.isReserved, true)
        )
      );
    
    return result;
  }
  
  async getUnreadReservationsForUser(userId: number): Promise<{item: WishItem, reservation: Reservation}[]> {
    // Obtener todas las reservas
    const allReservations = await this.getReservationsForUser(userId);
    
    // Obtener datos del usuario para comprobar la última visualización de notificaciones
    const user = await this.getUser(userId);
    if (!user || !user.lastNotificationsView) {
      // Si el usuario no existe o nunca ha visto notificaciones, devolver todas las reservas
      return allReservations;
    }
    
    // Filtrar sólo aquellas reservas que ocurrieron después de la última visualización
    return allReservations.filter(({ reservation }) => {
      if (!reservation.reservedAt || !user.lastNotificationsView) return false;
      return reservation.reservedAt > user.lastNotificationsView;
    });
  }
}

export const storage = new DatabaseStorage();
