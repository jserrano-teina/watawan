import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { 
  insertWishlistSchema, 
  insertWishlistItemSchema, 
  insertReservationSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/wishlists", async (req: Request, res: Response) => {
    // For demo purposes, we'll use the first user (id: 1)
    const userId = 1;
    
    try {
      const wishlists = await storage.getWishlistsByUserId(userId);
      
      // For each wishlist, get the items
      const result = await Promise.all(
        wishlists.map(async (wishlist) => {
          const items = await storage.getWishlistItemsByWishlistId(wishlist.id);
          return {
            ...wishlist,
            items: items.slice(0, 3), // Only return first 3 items for preview
            itemCount: items.length
          };
        })
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      res.status(500).json({ message: "Error fetching wishlists" });
    }
  });
  
  app.post("/api/wishlists", async (req: Request, res: Response) => {
    try {
      // For demo purposes, we'll use the first user (id: 1)
      const userId = 1;
      
      // Validate request body
      const data = insertWishlistSchema.parse({
        ...req.body,
        userId,
        shareableId: randomUUID()
      });
      
      const wishlist = await storage.createWishlist(data);
      res.status(201).json(wishlist);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating wishlist:", error);
        res.status(500).json({ message: "Error creating wishlist" });
      }
    }
  });
  
  app.get("/api/wishlists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wishlist ID" });
      }
      
      const wishlist = await storage.getWishlist(id);
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found" });
      }
      
      const items = await storage.getWishlistItemsByWishlistId(id);
      
      // Get reservation status for each item
      const itemsWithReservation = await Promise.all(
        items.map(async (item) => {
          const reservation = await storage.getReservationByItemId(item.id);
          return {
            ...item,
            isReserved: !!reservation,
            reservation: reservation || null
          };
        })
      );
      
      res.json({
        ...wishlist,
        items: itemsWithReservation
      });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Error fetching wishlist" });
    }
  });
  
  app.put("/api/wishlists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wishlist ID" });
      }
      
      const wishlist = await storage.getWishlist(id);
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found" });
      }
      
      const updatedWishlist = await storage.updateWishlist(id, req.body);
      res.json(updatedWishlist);
    } catch (error) {
      console.error("Error updating wishlist:", error);
      res.status(500).json({ message: "Error updating wishlist" });
    }
  });
  
  app.delete("/api/wishlists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wishlist ID" });
      }
      
      const wishlist = await storage.getWishlist(id);
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found" });
      }
      
      await storage.deleteWishlist(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting wishlist:", error);
      res.status(500).json({ message: "Error deleting wishlist" });
    }
  });
  
  // Wishlist items routes
  app.post("/api/wishlistItems", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const data = insertWishlistItemSchema.parse(req.body);
      
      // Verify the wishlist exists
      const wishlist = await storage.getWishlist(data.wishlistId);
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found" });
      }
      
      const item = await storage.createWishlistItem(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating wishlist item:", error);
        res.status(500).json({ message: "Error creating wishlist item" });
      }
    }
  });
  
  app.put("/api/wishlistItems/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const item = await storage.getWishlistItem(id);
      if (!item) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      const updatedItem = await storage.updateWishlistItem(id, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ message: "Error updating wishlist item" });
    }
  });
  
  app.delete("/api/wishlistItems/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const item = await storage.getWishlistItem(id);
      if (!item) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      await storage.deleteWishlistItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ message: "Error deleting wishlist item" });
    }
  });
  
  // Shared wishlist route
  app.get("/api/shared/:shareableId", async (req: Request, res: Response) => {
    try {
      const shareableId = req.params.shareableId;
      
      const wishlist = await storage.getWishlistByShareableId(shareableId);
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found" });
      }
      
      // Ensure the wishlist is public
      if (!wishlist.isPublic) {
        return res.status(403).json({ message: "This wishlist is private" });
      }
      
      const items = await storage.getWishlistItemsByWishlistId(wishlist.id);
      
      // Get user info (for this demo, we'll use a fixed user)
      const user = await storage.getUser(wishlist.userId);
      
      // Get reservation status for each item
      const itemsWithReservation = await Promise.all(
        items.map(async (item) => {
          const reservation = await storage.getReservationByItemId(item.id);
          
          // Check if this visitor has reserved the item
          const visitorId = req.query.visitorId as string;
          const isReservedByVisitor = reservation && reservation.visitorId === visitorId;
          
          return {
            ...item,
            isReserved: !!reservation,
            isReservedByVisitor,
            reservation: isReservedByVisitor ? reservation : null
          };
        })
      );
      
      res.json({
        ...wishlist,
        owner: user ? {
          username: user.username,
          id: user.id
        } : null,
        items: itemsWithReservation
      });
    } catch (error) {
      console.error("Error fetching shared wishlist:", error);
      res.status(500).json({ message: "Error fetching shared wishlist" });
    }
  });
  
  // Reservation routes
  app.post("/api/reservations", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const data = insertReservationSchema.parse(req.body);
      
      // Check if the item exists
      const item = await storage.getWishlistItem(data.itemId);
      if (!item) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      // Check if the item is already reserved
      const existingReservation = await storage.getReservationByItemId(data.itemId);
      if (existingReservation) {
        return res.status(409).json({ message: "This item is already reserved" });
      }
      
      const reservation = await storage.createReservation(data);
      res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: "Error creating reservation" });
      }
    }
  });
  
  app.delete("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid reservation ID" });
      }
      
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      await storage.deleteReservation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      res.status(500).json({ message: "Error deleting reservation" });
    }
  });
  
  app.delete("/api/reservations/item/:itemId", async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const reservation = await storage.getReservationByItemId(itemId);
      if (!reservation) {
        return res.status(404).json({ message: "No reservation found for this item" });
      }
      
      // Check if the visitor is the one who made the reservation
      const visitorId = req.query.visitorId as string;
      if (visitorId && reservation.visitorId !== visitorId) {
        return res.status(403).json({ message: "You are not authorized to cancel this reservation" });
      }
      
      await storage.deleteReservation(reservation.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reservation by item:", error);
      res.status(500).json({ message: "Error deleting reservation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
