import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Wishlist schema
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true).notNull(),
  shareableId: text("shareable_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  name: true,
  description: true,
  isPublic: true,
  shareableId: true,
});

// Wishlist item schema
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  wishlistId: integer("wishlist_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  link: text("link").notNull(),
  imageUrl: text("image_url"),
  store: text("store"),
  isPriority: boolean("is_priority").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).pick({
  wishlistId: true,
  name: true,
  description: true,
  price: true,
  link: true,
  imageUrl: true,
  store: true,
  isPriority: true,
});

// Reservation schema
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().unique(),
  visitorId: text("visitor_id").notNull(),
  visitorName: text("visitor_name"),
  reservedAt: timestamp("reserved_at").defaultNow().notNull(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  itemId: true,
  visitorId: true,
  visitorName: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
