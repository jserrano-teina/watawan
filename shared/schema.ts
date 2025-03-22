import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  initials: text("initials"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  initials: true,
});

// Wishlist schema
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  shareableLink: text("shareable_link").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  shareableLink: true,
});

// Wish item schema
export const wishItems = pgTable("wish_items", {
  id: serial("id").primaryKey(),
  wishlistId: integer("wishlist_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  purchaseLink: text("purchase_link").notNull(),
  imageUrl: text("image_url"),
  isReserved: boolean("is_reserved").default(false),
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
});

// Reservation schema
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  wishItemId: integer("wish_item_id").notNull().unique(),
  reserverName: text("reserver_name"),
  reservedAt: timestamp("reserved_at").defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  wishItemId: true,
  reserverName: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type WishItem = typeof wishItems.$inferSelect;
export type InsertWishItem = z.infer<typeof insertWishItemSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
