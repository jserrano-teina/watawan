import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  initials: text("initials"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  lastNotificationsView: timestamp("last_notifications_view"),
  settings: json("settings").default({}),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  displayName: true,
  initials: true,
  avatar: true,
});

// Sesión schema (compatibilidad con express-session)
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Wishlist schema
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").default("Mi lista de deseos"),  // Nombre de la lista
  slug: text("slug"),  // Slug para URL amigable
  shareableLink: text("shareable_link").notNull().unique(),  // Mantenemos para compatibilidad
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  shareableLink: true,
  name: true,
  slug: true,
});

// Wish item schema
export const wishItems = pgTable("wish_items", {
  id: serial("id").primaryKey(),
  wishlistId: integer("wishlist_id").notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  purchaseLink: text("purchase_link").notNull(),
  imageUrl: text("image_url"),
  price: text("price"),
  isReserved: boolean("is_reserved").default(false),
  isReceived: boolean("is_received").default(false),
  reservedBy: text("reserved_by"),
  reserverName: text("reserver_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWishItemSchema = createInsertSchema(wishItems).pick({
  wishlistId: true,
  title: true,
  description: true,
  purchaseLink: true,
  imageUrl: true,
  price: true,
});

// Reservation schema
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  wishItemId: integer("wish_item_id").notNull().unique().references(() => wishItems.id, { onDelete: 'cascade' }),
  reserverName: text("reserver_name"),
  reservedAt: timestamp("reserved_at").defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  wishItemId: true,
  reserverName: true,
});

// Export types
export type User = {
  id: number;
  email: string;
  password: string;
  displayName: string | null;
  initials: string | null;
  avatar: string | null;
  createdAt: Date | null;
  lastLogin: Date | null;
  lastNotificationsView: Date | null;
  settings: Record<string, any> | null;
};
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Wishlist = {
  id: number;
  userId: number;
  name: string | null;
  slug: string | null;
  shareableLink: string;
  createdAt: Date | null;
};
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type WishItem = {
  id: number;
  wishlistId: number;
  title: string;
  description: string | null;
  purchaseLink: string;
  imageUrl: string | null;
  price: string | null;
  isReserved: boolean;
  isReceived: boolean;
  reservedBy: string | null;
  reserverName: string | null;
  createdAt: Date | null;
};
export type InsertWishItem = z.infer<typeof insertWishItemSchema>;

export type Reservation = {
  id: number;
  wishItemId: number;
  reserverName: string | null;
  reservedAt: Date | null;
};
export type InsertReservation = z.infer<typeof insertReservationSchema>;
