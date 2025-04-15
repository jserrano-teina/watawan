import { 
  User, InsertUser, 
  Wishlist, InsertWishlist, 
  WishItem, InsertWishItem, 
  Reservation, InsertReservation,
  users, wishlists, wishItems, reservations
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, or, desc, sql, asc, lt, gt } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import { generateSlug, generateShareableId } from "./utils";

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
    if (!result.length) return undefined;
    
    // Asegurarnos de que los tipos coinciden con la interfaz User
    return {
      ...result[0],
      // Convertir explícitamente el campo settings a Record<string, any> | null
      settings: result[0].settings as Record<string, any> | null
    };
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    if (!result.length) return undefined;
    
    // Asegurarnos de que los tipos coinciden con la interfaz User
    return {
      ...result[0],
      // Convertir explícitamente el campo settings a Record<string, any> | null
      settings: result[0].settings as Record<string, any> | null
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Crear el usuario
      console.log(`Creando nuevo usuario con email: ${insertUser.email}`);
      const [user] = await db.insert(users).values(insertUser).returning();
      console.log(`Usuario creado con ID: ${user.id}`);
      
      // Convertir el objeto user al tipo User
      const typedUser: User = {
        ...user,
        settings: user.settings as Record<string, any> | null
      };
      
      // Crear wishlist por defecto para el usuario
      const shareableLink = nanoid(10);
      console.log(`Creando wishlist predeterminada para usuario ${typedUser.id} con link ${shareableLink}`);
      
      try {
        const defaultName = "Mi lista de deseos";
        const slug = generateSlug(defaultName);
        
        const [wishlist] = await db.insert(wishlists).values({
          userId: typedUser.id,
          name: defaultName,
          slug,
          shareableLink
        }).returning();
        
        console.log(`Wishlist creada para usuario ${typedUser.id}: ${wishlist.id} con link ${wishlist.shareableLink}`);
      } catch (wishlistError) {
        console.error(`Error al crear wishlist para usuario ${typedUser.id}:`, wishlistError);
        // Intentar de nuevo con un nuevo shareableLink
        try {
          const newShareableLink = nanoid(10);
          console.log(`Reintentando crear wishlist para usuario ${typedUser.id} con nuevo link ${newShareableLink}`);
          
          const defaultName = "Mi lista de deseos";
          const slug = generateSlug(defaultName);
          
          const [retryWishlist] = await db.insert(wishlists).values({
            userId: typedUser.id,
            name: defaultName,
            slug,
            shareableLink: newShareableLink
          }).returning();
          
          console.log(`Wishlist creada en segundo intento para usuario ${typedUser.id}: ${retryWishlist.id}`);
        } catch (retryError) {
          console.error(`Error en segundo intento de crear wishlist para usuario ${typedUser.id}:`, retryError);
          // Continuamos con la ejecución a pesar del error - el mecanismo de seguridad
          // en getUserWishlists creará una wishlist cuando sea necesario
        }
      }
      
      return typedUser;
    } catch (error) {
      console.error(`Error en createUser:`, error);
      throw error;
    }
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
    
    // Convertir el objeto a tipo User
    return {
      ...updatedUser,
      settings: updatedUser.settings as Record<string, any> | null
    };
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
  
  async getWishlistByUserAndSlug(username: string, slug: string): Promise<Wishlist | undefined> {
    console.log(`[getWishlistByUserAndSlug] Buscando wishlist para usuario=${username}, slug=${slug}`);
    // Primero, buscar el usuario por nombre de usuario (displayName) o por email
    const user = await db.select().from(users).where(
      or(
        eq(users.email, username),
        sql`LOWER(${users.email}) = LOWER(${username})`,
        sql`LOWER(${users.displayName}) = LOWER(${username})`
      )
    ).limit(1);
    
    if (!user.length) {
      console.log(`[getWishlistByUserAndSlug] No se encontró usuario con username=${username}`);
      return undefined;
    }
    
    console.log(`[getWishlistByUserAndSlug] Usuario encontrado: id=${user[0].id}, email=${user[0].email}`);
    
    // Buscar la wishlist por userId y slug
    const result = await db.select().from(wishlists).where(
      and(
        eq(wishlists.userId, user[0].id),
        eq(wishlists.slug, slug)
      )
    );
    
    if (!result.length) {
      console.log(`[getWishlistByUserAndSlug] No se encontró wishlist para userId=${user[0].id}, slug=${slug}`);
    } else {
      console.log(`[getWishlistByUserAndSlug] Wishlist encontrada: id=${result[0].id}`);
    }
    
    return result.length ? result[0] : undefined;
  }

  async getUserWishlists(userId: number): Promise<Wishlist[]> {
    try {
      console.log(`[getUserWishlists] Buscando wishlists para usuario ${userId}`);
      const userWishlists = await db.select().from(wishlists).where(eq(wishlists.userId, userId));
      
      // Si no se encuentra ninguna wishlist para el usuario, crear una por defecto
      if (userWishlists.length === 0) {
        console.log(`[getUserWishlists] No se encontraron wishlists para el usuario ${userId}. Creando una por defecto.`);
        
        try {
          const shareableLink = nanoid(10);
          console.log(`[getUserWishlists] Generado shareableLink: ${shareableLink}`);
          
          const defaultName = "Mi lista de deseos";
          const slug = generateSlug(defaultName);
          
          const [newWishlist] = await db.insert(wishlists).values({
            userId,
            name: defaultName,
            slug,
            shareableLink
          }).returning();
          
          console.log(`[getUserWishlists] Wishlist creada para usuario ${userId}: ${newWishlist.id} con link ${newWishlist.shareableLink}`);
          return [newWishlist];
        } catch (createError) {
          console.error(`[getUserWishlists] Error al crear wishlist para usuario ${userId}:`, createError);
          
          // Intentar de nuevo con un nuevo shareableLink en caso de error de duplicación
          try {
            const newShareableLink = nanoid(10);
            console.log(`[getUserWishlists] Reintentando con nuevo shareableLink: ${newShareableLink}`);
            
            const defaultName = "Mi lista de deseos";
            const slug = generateSlug(defaultName);
            
            const [retryWishlist] = await db.insert(wishlists).values({
              userId,
              name: defaultName,
              slug,
              shareableLink: newShareableLink
            }).returning();
            
            console.log(`[getUserWishlists] Wishlist creada en segundo intento para usuario ${userId}: ${retryWishlist.id}`);
            return [retryWishlist];
          } catch (retryError) {
            console.error(`[getUserWishlists] Error en segundo intento de crear wishlist:`, retryError);
            throw new Error(`No se pudo crear una wishlist para el usuario ${userId} después de varios intentos`);
          }
        }
      }
      
      console.log(`[getUserWishlists] Se encontraron ${userWishlists.length} wishlists para el usuario ${userId}`);
      return userWishlists;
    } catch (error) {
      console.error(`[getUserWishlists] Error general:`, error);
      throw error;
    }
  }

  async createWishlist(wishlist: InsertWishlist): Promise<Wishlist> {
    // Si no se proporcionó un nombre personalizado, usar uno por defecto
    if (!wishlist.name) {
      wishlist.name = "Mi lista de deseos";
    }
    
    // Si no hay slug, generarlo a partir del nombre
    if (!wishlist.slug) {
      wishlist.slug = generateSlug(wishlist.name);
    }
    
    // Si no hay shareableLink, generarlo usando nanoid para compatibilidad
    if (!wishlist.shareableLink) {
      wishlist.shareableLink = generateShareableId(10);
    }
    
    const [newWishlist] = await db.insert(wishlists).values(wishlist).returning();
    return newWishlist;
  }

  // WishItem operations
  async getWishItemsForWishlist(wishlistId: number, includeReceived: boolean = false): Promise<WishItem[]> {
    // Construir la consulta base
    let rawItems = [];
    
    if (includeReceived) {
      rawItems = await db.select().from(wishItems).where(eq(wishItems.wishlistId, wishlistId));
    } else {
      rawItems = await db.select().from(wishItems)
        .where(and(
          eq(wishItems.wishlistId, wishlistId),
          eq(wishItems.isReceived, false)
        ));
    }
    
    // Convertir los ítems al tipo correcto
    const items: WishItem[] = rawItems.map(item => ({
      ...item,
      isReserved: item.isReserved === null ? false : !!item.isReserved,
      isReceived: item.isReceived === null ? false : !!item.isReceived
    }));
    
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
    if (!result.length) return undefined;
    
    // Convertir al tipo correcto
    return {
      ...result[0],
      isReserved: result[0].isReserved === null ? false : !!result[0].isReserved,
      isReceived: result[0].isReceived === null ? false : !!result[0].isReceived
    };
  }

  async createWishItem(item: InsertWishItem): Promise<WishItem> {
    const [rawItem] = await db.insert(wishItems).values({
      ...item,
      isReserved: false,
      isReceived: false
    }).returning();
    
    // Convertir al tipo correcto
    return {
      ...rawItem,
      isReserved: rawItem.isReserved === null ? false : !!rawItem.isReserved,
      isReceived: rawItem.isReceived === null ? false : !!rawItem.isReceived
    };
  }

  async updateWishItem(id: number, itemUpdate: Partial<WishItem>): Promise<WishItem> {
    const [rawItem] = await db
      .update(wishItems)
      .set(itemUpdate)
      .where(eq(wishItems.id, id))
      .returning();
      
    if (!rawItem) {
      throw new Error(`Wish item with ID ${id} not found`);
    }
    
    // Convertir al tipo correcto
    return {
      ...rawItem,
      isReserved: rawItem.isReserved === null ? false : !!rawItem.isReserved,
      isReceived: rawItem.isReceived === null ? false : !!rawItem.isReceived
    };
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
    const rawResult = await db
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
    
    // Convertir los items a tipos correctos
    return rawResult.map(record => ({
      item: {
        ...record.item,
        isReserved: record.item.isReserved === null ? false : !!record.item.isReserved,
        isReceived: record.item.isReceived === null ? false : !!record.item.isReceived
      } as WishItem,
      reservation: record.reservation
    }));
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
