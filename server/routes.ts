import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWishItemSchema, 
  insertReservationSchema,
  User
} from "@shared/schema";
import { nanoid } from "nanoid";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Mock user ID for demo purposes - in a real app, this would come from authentication
const DEMO_USER_ID = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const router = express.Router();

  // Middleware to add current user to requests
  router.use(async (req: Request & { user?: User }, res, next) => {
    try {
      // In a real app, this would use authentication
      // For demo, we'll use the default user
      const user = await storage.getUser(DEMO_USER_ID);
      if (user) {
        req.user = user;
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  // Get current user
  router.get("/user", async (req: Request & { user?: User }, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Get user's wishlist
  router.get("/wishlist", async (req: Request & { user?: User }, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const wishlists = await storage.getUserWishlists(req.user.id);
    
    if (wishlists.length === 0) {
      // Create a default wishlist if none exists
      const shareableLink = nanoid(10);
      const newWishlist = await storage.createWishlist({
        userId: req.user.id,
        shareableLink
      });
      return res.json(newWishlist);
    }
    
    // Return the first wishlist (most users will only have one)
    res.json(wishlists[0]);
  });

  // Get wishlist by shareable link
  router.get("/wishlist/shared/:link", async (req, res) => {
    const { link } = req.params;
    
    const wishlist = await storage.getWishlistByShareableLink(link);
    
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    
    const owner = await storage.getUser(wishlist.userId);
    if (!owner) {
      return res.status(404).json({ message: "Wishlist owner not found" });
    }
    
    // Don't include password in response
    const { password, ...ownerInfo } = owner;
    
    res.json({ wishlist, owner: ownerInfo });
  });

  // Get wish items for a wishlist
  router.get("/wishlist/:id/items", async (req, res) => {
    const { id } = req.params;
    const wishlistId = parseInt(id, 10);
    
    if (isNaN(wishlistId)) {
      return res.status(400).json({ message: "Invalid wishlist ID" });
    }
    
    const wishlist = await storage.getWishlist(wishlistId);
    
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    
    const items = await storage.getWishItemsForWishlist(wishlistId);
    res.json(items);
  });

  // Create a new wish item
  router.post("/wishlist/:id/items", async (req: Request & { user?: User }, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { id } = req.params;
    const wishlistId = parseInt(id, 10);
    
    if (isNaN(wishlistId)) {
      return res.status(400).json({ message: "Invalid wishlist ID" });
    }
    
    const wishlist = await storage.getWishlist(wishlistId);
    
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    
    if (wishlist.userId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to add items to this wishlist" });
    }
    
    try {
      // Intentar extraer la imagen y el precio automáticamente del enlace de compra
      let itemData = { ...req.body };
      delete itemData.imageUrl; // Eliminamos cualquier URL proporcionada para usar extracción automática
      delete itemData.price; // Eliminamos cualquier precio proporcionado para usar extracción automática
      
      // Importar dinámicamente para evitar problemas de dependencia circular
      if (itemData.purchaseLink) {
        try {
          console.log(`Intentando extraer metadata de: ${itemData.purchaseLink}`);
          const { getUrlMetadata } = await import('./metascraper');
          const metadata = await getUrlMetadata(itemData.purchaseLink);
          
          // Extraer imagen
          if (metadata.imageUrl) {
            console.log(`Imagen extraída correctamente: ${metadata.imageUrl}`);
            itemData.imageUrl = metadata.imageUrl;
          } else {
            console.log(`No se pudo extraer imagen para: ${itemData.purchaseLink}`);
          }
          
          // Extraer precio
          if (metadata.price) {
            console.log(`Precio extraído correctamente: ${metadata.price}`);
            itemData.price = metadata.price;
          } else {
            console.log(`No se pudo extraer precio para: ${itemData.purchaseLink}`);
          }
        } catch (metaError) {
          console.error('Error al extraer metadatos:', metaError);
          // Continuar sin la imagen y precio
        }
      }
      
      // Validar y crear el item
      const validatedItemData = insertWishItemSchema.parse({ ...itemData, wishlistId });
      const newItem = await storage.createWishItem(validatedItemData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      throw error;
    }
  });

  // Update a wish item
  router.put("/wishlist/items/:id", async (req: Request & { user?: User }, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { id } = req.params;
    const itemId = parseInt(id, 10);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    const item = await storage.getWishItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: "Wish item not found" });
    }
    
    const wishlist = await storage.getWishlist(item.wishlistId);
    
    if (!wishlist || wishlist.userId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to update this item" });
    }
    
    // Don't allow updating reserved status through this endpoint
    const { isReserved, reservedBy, ...updateData } = req.body;
    
    // Si se actualizó la URL de compra, intentar extraer la imagen y el precio automáticamente
    if (
      updateData.purchaseLink && 
      updateData.purchaseLink !== item.purchaseLink
    ) {
      // Eliminamos cualquier URL de imagen y precio previos para siempre intentar extraerlos de nuevo
      updateData.imageUrl = undefined;
      updateData.price = undefined;
      try {
        console.log(`Intentando extraer metadata para actualización de: ${updateData.purchaseLink}`);
        const { getUrlMetadata } = await import('./metascraper');
        const metadata = await getUrlMetadata(updateData.purchaseLink);
        
        // Extraer imagen
        if (metadata.imageUrl) {
          console.log(`Imagen extraída correctamente en actualización: ${metadata.imageUrl}`);
          updateData.imageUrl = metadata.imageUrl;
        } else {
          console.log(`No se pudo extraer imagen para actualización: ${updateData.purchaseLink}`);
        }
        
        // Extraer precio
        if (metadata.price) {
          console.log(`Precio extraído correctamente en actualización: ${metadata.price}`);
          updateData.price = metadata.price;
        } else {
          console.log(`No se pudo extraer precio para actualización: ${updateData.purchaseLink}`);
        }
      } catch (metaError) {
        console.error('Error al extraer metadatos durante actualización:', metaError);
        // Continuar sin la imagen y el precio
      }
    }
    
    const updatedItem = await storage.updateWishItem(itemId, updateData);
    res.json(updatedItem);
  });

  // Delete a wish item
  router.delete("/wishlist/items/:id", async (req: Request & { user?: User }, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { id } = req.params;
    const itemId = parseInt(id, 10);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    const item = await storage.getWishItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: "Wish item not found" });
    }
    
    const wishlist = await storage.getWishlist(item.wishlistId);
    
    if (!wishlist || wishlist.userId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to delete this item" });
    }
    
    await storage.deleteWishItem(itemId);
    res.status(204).send();
  });

  // Reserve a wish item
  router.post("/wishlist/items/:id/reserve", async (req, res) => {
    const { id } = req.params;
    const itemId = parseInt(id, 10);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    const item = await storage.getWishItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: "Wish item not found" });
    }
    
    if (item.isReserved) {
      return res.status(400).json({ message: "This item is already reserved" });
    }
    
    try {
      // Validate the reservation data
      const parsedData = insertReservationSchema.parse({ 
        ...req.body, 
        wishItemId: itemId 
      });
      
      // Nos aseguramos de que reserverName sea string o undefined, no null
      const reserverName = parsedData.reserverName === null ? undefined : parsedData.reserverName;
      
      const reservation = await storage.reserveWishItem(itemId, reserverName);
      res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      throw error;
    }
  });

  // Get reserved items for a user
  router.get("/reserved-items", async (req: Request & { user?: User }, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const reservations = await storage.getReservationsForUser(req.user.id);
    res.json(reservations);
  });

  app.use("/api", router);
  return httpServer;
}
