import express, { type Express, Request, Response, NextFunction } from "express";
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
import { setupAuth, requireAuth } from "./auth";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Middleware para redirigir URLs amigables a la página principal
  app.use('/lista/:username/:slug', (req, res, next) => {
    if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
      console.log(`[Middleware] Redirigiendo URL amigable a index.html: ${req.url}`);
      return res.sendFile(path.resolve(process.cwd(), 'client/dist/index.html'));
    }
    next();
  });
  
  const router = express.Router();

  // Configurar autenticación
  setupAuth(app);

  // Get user's wishlist
  router.get("/wishlist", requireAuth, async (req: Request, res: Response) => {
    // En este punto sabemos que req.user existe porque requireAuth lo verifica
    const user = req.user as User;
    
    console.log(`[GET /wishlist] Obteniendo wishlists para el usuario ${user.id}`);
    
    try {
      // getUserWishlists ya creará una wishlist por defecto si no existe ninguna
      const wishlists = await storage.getUserWishlists(user.id);
      
      if (wishlists.length === 0) {
        // Este caso no debería ocurrir ahora, pero mantenemos el código por seguridad
        console.log(`[GET /wishlist] No se encontró ninguna wishlist para el usuario ${user.id}, creando una nueva`);
        const shareableLink = nanoid(10);
        const newWishlist = await storage.createWishlist({
          userId: user.id,
          shareableLink
        });
        console.log(`[GET /wishlist] Nueva wishlist creada para el usuario ${user.id}: ${newWishlist.id}`);
        return res.json(newWishlist);
      }
      
      console.log(`[GET /wishlist] Devolviendo wishlist ${wishlists[0].id} para el usuario ${user.id}`);
      // Return the first wishlist (most users will only have one)
      res.json(wishlists[0]);
    } catch (error) {
      console.error(`[GET /wishlist] Error obteniendo wishlists para el usuario ${user.id}:`, error);
      
      // Intento de último recurso para crear una wishlist
      try {
        console.log(`[GET /wishlist] Intento de recuperación: creando una nueva wishlist para el usuario ${user.id}`);
        const shareableLink = nanoid(10);
        const newWishlist = await storage.createWishlist({
          userId: user.id,
          shareableLink
        });
        console.log(`[GET /wishlist] Wishlist de recuperación creada: ${newWishlist.id}`);
        return res.json(newWishlist);
      } catch (recoveryError) {
        console.error(`[GET /wishlist] Error en intento de recuperación:`, recoveryError);
        return res.status(500).json({ 
          message: "Error al obtener o crear wishlist",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Get wishlist by shareable link (legacy format)
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
  
  // Get wishlist by username and slug (new friendly URL format)
  router.get("/wl/:username/:slug", async (req, res) => {
    const { username, slug } = req.params;
    
    // Buscar la wishlist usando el nuevo método
    const wishlist = await storage.getWishlistByUserAndSlug(username, slug);
    
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
  
  // Get items for a shared wishlist - never includes received items (legacy format)
  router.get("/wishlist/shared/:link/items", async (req, res) => {
    const { link } = req.params;
    
    const wishlist = await storage.getWishlistByShareableLink(link);
    
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    
    // Para listas compartidas, nunca incluimos los elementos recibidos
    const includeReceived = false;
    
    const items = await storage.getWishItemsForWishlist(wishlist.id, includeReceived);
    res.json(items);
  });
  
  // Get items for a shared wishlist with friendly URL - never includes received items
  router.get("/wl/:username/:slug/items", async (req, res) => {
    const { username, slug } = req.params;
    
    const wishlist = await storage.getWishlistByUserAndSlug(username, slug);
    
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    
    // Para listas compartidas, nunca incluimos los elementos recibidos
    const includeReceived = false;
    
    const items = await storage.getWishItemsForWishlist(wishlist.id, includeReceived);
    res.json(items);
  });

  // Get wish items for a wishlist
  router.get("/wishlist/:id/items", async (req: Request & { user?: User }, res) => {
    const { id } = req.params;
    const wishlistId = parseInt(id, 10);
    
    if (isNaN(wishlistId)) {
      return res.status(400).json({ message: "Invalid wishlist ID" });
    }
    
    const wishlist = await storage.getWishlist(wishlistId);
    
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    
    // Determinar si es el propietario quien accede o un visitante
    const isOwnerAccess = req.user && req.user.id === wishlist.userId;
    
    // Si es el propietario, incluimos los elementos recibidos
    // Si es un visitante (acceso compartido), no incluimos elementos recibidos
    const includeReceived = isOwnerAccess;
    
    const items = await storage.getWishItemsForWishlist(wishlistId, includeReceived);
    res.json(items);
  });

  // Create a new wish item
  router.post("/wishlist/:id/items", async (req: Request & { user?: User }, res) => {
    console.log(`[POST /wishlist/:id/items] Iniciando creación de nuevo deseo`);
    
    if (!req.user) {
      console.log(`[POST /wishlist/:id/items] Error: Usuario no autenticado`);
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log(`[POST /wishlist/:id/items] Usuario autenticado: ${req.user.id} (${req.user.email})`);
    
    try {
      const { id } = req.params;
      const wishlistId = parseInt(id, 10);
      
      if (isNaN(wishlistId)) {
        console.log(`[POST /wishlist/:id/items] Error: ID de wishlist inválido: ${id}`);
        return res.status(400).json({ message: "Invalid wishlist ID" });
      }
      
      // Función para obtener o crear una wishlist válida para el usuario
      const getOrCreateWishlist = async (userId: number, requestedWishlistId?: number) => {
        console.log(`[getOrCreateWishlist] Obteniendo wishlist para usuario ${userId}${requestedWishlistId ? `, wishlist solicitada: ${requestedWishlistId}` : ''}`);
        
        try {
          // Paso 1: Si se solicitó una wishlist específica, intentar obtenerla
          if (requestedWishlistId) {
            const specificWishlist = await storage.getWishlist(requestedWishlistId);
            
            // Verificar si existe y pertenece al usuario
            if (specificWishlist && specificWishlist.userId === userId) {
              console.log(`[getOrCreateWishlist] Wishlist específica encontrada y verificada: ${specificWishlist.id}`);
              return specificWishlist;
            } else {
              console.log(`[getOrCreateWishlist] La wishlist solicitada ${requestedWishlistId} no existe o no pertenece al usuario ${userId}`);
            }
          }
          
          // Paso 2: Intentar obtener cualquier wishlist del usuario
          console.log(`[getOrCreateWishlist] Buscando wishlists existentes para usuario ${userId}`);
          const userWishlists = await storage.getUserWishlists(userId);
          
          if (userWishlists.length > 0) {
            console.log(`[getOrCreateWishlist] Se encontraron ${userWishlists.length} wishlists, usando la primera: ${userWishlists[0].id}`);
            return userWishlists[0];
          }
          
          // Paso 3: Como último recurso, intentar crear una nueva wishlist
          console.log(`[getOrCreateWishlist] No se encontraron wishlists, creando una nueva para usuario ${userId}`);
          const shareableLink = nanoid(10);
          const defaultName = "Mi lista de deseos";
          // Importar la función de utilidades
          const { generateSlug } = await import('./utils');
          const slug = generateSlug(defaultName);
          
          // Crear wishlist con todos los campos necesarios
          const newWishlist = await storage.createWishlist({
            userId,
            name: defaultName,
            slug,
            shareableLink
          });
          
          console.log(`[getOrCreateWishlist] Nueva wishlist creada: ${newWishlist.id}`);
          return newWishlist;
        } catch (error) {
          console.error(`[getOrCreateWishlist] Error crítico:`, error);
          throw new Error(`No se pudo obtener o crear una wishlist válida: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Usar la función para obtener o crear una wishlist válida
      console.log(`[POST /wishlist/:id/items] Obteniendo wishlist para deseo`);
      const targetWishlist = await getOrCreateWishlist(req.user.id, wishlistId);
      
      // Log para confirmar qué wishlist se está usando
      console.log(`[POST /wishlist/:id/items] Usando wishlist: ${targetWishlist.id} para la creación del deseo`);
      
      // Guardar los datos originales del cuerpo de la solicitud
      let itemData = { ...req.body };
      console.log(`[POST /wishlist/:id/items] Datos recibidos:`, itemData);
      
      const originalImageUrl = itemData.imageUrl;
      const originalPrice = itemData.price;
      
      // Solo intentar extraer la imagen y el precio si no se proporcionaron manualmente
      if (itemData.purchaseLink) {
        try {
          console.log(`[POST /wishlist/:id/items] Intentando extraer metadata de: ${itemData.purchaseLink}`);
          const { getUrlMetadata } = await import('./metascraper');
          const metadata = await getUrlMetadata(itemData.purchaseLink);
          
          // Usar la imagen extraída solo si no se proporcionó una manualmente
          if (!originalImageUrl && metadata.imageUrl) {
            console.log(`[POST /wishlist/:id/items] Imagen extraída correctamente: ${metadata.imageUrl}`);
            itemData.imageUrl = metadata.imageUrl;
          } else if (originalImageUrl) {
            console.log(`[POST /wishlist/:id/items] Usando imagen proporcionada manualmente: ${originalImageUrl}`);
            itemData.imageUrl = originalImageUrl;
          } else {
            console.log(`[POST /wishlist/:id/items] No se pudo extraer imagen para: ${itemData.purchaseLink}`);
          }
          
          // Usar el precio extraído solo si no se proporcionó uno manualmente
          if (!originalPrice && metadata.price) {
            console.log(`[POST /wishlist/:id/items] Precio extraído correctamente: ${metadata.price}`);
            itemData.price = metadata.price;
          } else if (originalPrice) {
            console.log(`[POST /wishlist/:id/items] Usando precio proporcionado manualmente: ${originalPrice}`);
            itemData.price = originalPrice;
          } else {
            console.log(`[POST /wishlist/:id/items] No se pudo extraer precio para: ${itemData.purchaseLink}`);
          }
        } catch (metaError) {
          console.error('[POST /wishlist/:id/items] Error al extraer metadatos:', metaError);
          // Restaurar los valores originales si hay error
          if (originalImageUrl) itemData.imageUrl = originalImageUrl;
          if (originalPrice) itemData.price = originalPrice;
        }
      } else {
        // Si no hay enlace de compra, usar los valores proporcionados
        if (originalImageUrl) itemData.imageUrl = originalImageUrl;
        if (originalPrice) itemData.price = originalPrice;
      }
      
      // Ajustar el ID de la wishlist al que realmente vamos a usar
      const finalWishlistId = targetWishlist.id;
      console.log(`[POST /wishlist/:id/items] Usando wishlist ID para el item: ${finalWishlistId}`);
      
      // Validar y crear el item
      console.log(`[POST /wishlist/:id/items] Validando datos de item antes de crear`);
      const validatedItemData = insertWishItemSchema.parse({ ...itemData, wishlistId: finalWishlistId });
      
      console.log(`[POST /wishlist/:id/items] Creando nuevo item en wishlist ${finalWishlistId}`);
      const newItem = await storage.createWishItem(validatedItemData);
      
      console.log(`[POST /wishlist/:id/items] Item creado exitosamente con ID: ${newItem.id}`);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        console.log(`[POST /wishlist/:id/items] Error de validación: ${validationError.message}`);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error(`[POST /wishlist/:id/items] Error inesperado:`, error);
      res.status(500).json({ 
        message: "Ha ocurrido un error al crear el deseo", 
        error: error instanceof Error ? error.message : String(error)
      });
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
      // Guardar los datos originales
      const originalImageUrl = updateData.imageUrl;
      const originalPrice = updateData.price;
      
      try {
        console.log(`Intentando extraer metadata para actualización de: ${updateData.purchaseLink}`);
        const { getUrlMetadata } = await import('./metascraper');
        const metadata = await getUrlMetadata(updateData.purchaseLink);
        
        // Usar la imagen extraída solo si no se proporcionó una manualmente
        if (!originalImageUrl && metadata.imageUrl) {
          console.log(`Imagen extraída correctamente en actualización: ${metadata.imageUrl}`);
          updateData.imageUrl = metadata.imageUrl;
        } else if (originalImageUrl) {
          console.log(`Usando imagen proporcionada manualmente en actualización: ${originalImageUrl}`);
          updateData.imageUrl = originalImageUrl;
        } else {
          console.log(`No se pudo extraer imagen para actualización: ${updateData.purchaseLink}`);
        }
        
        // Usar el precio extraído solo si no se proporcionó uno manualmente
        if (!originalPrice && metadata.price) {
          console.log(`Precio extraído correctamente en actualización: ${metadata.price}`);
          updateData.price = metadata.price;
        } else if (originalPrice) {
          console.log(`Usando precio proporcionado manualmente en actualización: ${originalPrice}`);
          updateData.price = originalPrice;
        } else {
          console.log(`No se pudo extraer precio para actualización: ${updateData.purchaseLink}`);
        }
      } catch (metaError) {
        console.error('Error al extraer metadatos durante actualización:', metaError);
        // Restaurar los valores originales si hay error
        if (originalImageUrl) updateData.imageUrl = originalImageUrl;
        if (originalPrice) updateData.price = originalPrice;
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

  // Reserve a wish item (legacy format)
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
  
  // Reserve a wish item from friendly URL format
  router.post("/wl/:username/:slug/items/:id/reserve", async (req, res) => {
    const { id, username, slug } = req.params;
    const itemId = parseInt(id, 10);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    // Verificar que la wishlist existe
    const wishlist = await storage.getWishlistByUserAndSlug(username, slug);
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    
    // Verificar que el item existe y pertenece a esta wishlist
    const item = await storage.getWishItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Wish item not found" });
    }
    
    if (item.wishlistId !== wishlist.id) {
      return res.status(400).json({ message: "Item does not belong to this wishlist" });
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
  
  // Unreserve a wish item
  router.post("/wishlist/items/:id/unreserve", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    const { id } = req.params;
    const itemId = parseInt(id, 10);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "ID de item inválido" });
    }
    
    const item = await storage.getWishItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: "Item no encontrado" });
    }
    
    const wishlist = await storage.getWishlist(item.wishlistId);
    
    if (!wishlist || wishlist.userId !== user.id) {
      return res.status(403).json({ message: "No tienes permiso para desmarcar este item como reservado" });
    }
    
    if (!item.isReserved) {
      return res.status(400).json({ message: "Este item no está reservado" });
    }
    
    if (item.isReceived) {
      return res.status(400).json({ message: "No se puede desmarcar como reservado un item que ya ha sido recibido" });
    }
    
    try {
      const updatedItem = await storage.unreserveWishItem(itemId);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error al desmarcar item como reservado:", error);
      res.status(500).json({ message: "Error al desmarcar el item como reservado" });
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
  
  // Get unread notifications (reservations)
  router.get("/notifications/unread", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    
    const unreadReservations = await storage.getUnreadReservationsForUser(user.id);
    res.json(unreadReservations);
  });
  
  // Mark notifications as read
  router.post("/notifications/mark-read", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    
    const updatedUser = await storage.updateLastNotificationsView(user.id);
    res.json({ success: true, lastNotificationsView: updatedUser.lastNotificationsView });
  });
  
  // Mark wish item as received
  router.post("/wishlist/items/:id/received", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
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
    
    if (!wishlist || wishlist.userId !== user.id) {
      return res.status(403).json({ message: "You don't have permission to mark this item as received" });
    }
    
    try {
      const updatedItem = await storage.markWishItemAsReceived(itemId);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error marking item as received:", error);
      res.status(500).json({ message: "Error al marcar el regalo como recibido" });
    }
  });
  
  // Actualizar perfil de usuario
  router.put("/user/profile", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    const { displayName, initials, avatar } = req.body;
    
    try {
      const updatedUser = await storage.updateUser(user.id, { 
        displayName, 
        initials, 
        avatar 
      });
      
      // Excluir password del resultado
      const { password, ...userInfo } = updatedUser;
      
      res.status(200).json(userInfo);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({ message: "Error al actualizar el perfil" });
    }
  });
  
  // Actualizar email de usuario (requiere verificación de contraseña)
  router.put("/user/email", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }
    
    try {
      // Verificar primero si el email ya está en uso
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: "Este email ya está en uso" });
      }
      
      // Verificar contraseña
      const currentUser = await storage.getUser(user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const { comparePasswords } = await import('./auth');
      const passwordMatch = await comparePasswords(password, currentUser.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: "Contraseña incorrecta" });
      }
      
      // Actualizar email
      const updatedUser = await storage.updateUser(user.id, { email });
      
      // Excluir password del resultado
      const { password: _, ...userInfo } = updatedUser;
      
      res.status(200).json(userInfo);
    } catch (error) {
      console.error("Error actualizando email:", error);
      res.status(500).json({ message: "Error al actualizar el email" });
    }
  });

  // Endpoint para extraer metadatos de una URL sin crear un elemento
  // Función para limpiar URL de Amazon de parámetros innecesarios
  function cleanAmazonUrl(inputUrl: string): string {
    try {
      const urlObj = new URL(inputUrl);
      
      // Si es una URL de Amazon, limpiar parámetros de tracking
      if (urlObj.hostname.includes('amazon.') || urlObj.hostname.includes('amzn.')) {
        // Extraer solo la parte esencial de la URL
        const pathParts = urlObj.pathname.split('/');
        
        // Verificar si la URL tiene un formato de producto de Amazon con /dp/ o /gp/product/
        if (urlObj.pathname.includes('/dp/')) {
          // Formato /dp/{ASIN}
          const dpIndex = pathParts.indexOf('dp');
          if (dpIndex !== -1 && dpIndex + 1 < pathParts.length) {
            const asin = pathParts[dpIndex + 1];
            // Construir URL limpia con solo el ASIN
            return `https://${urlObj.hostname}/dp/${asin}`;
          }
        } else if (urlObj.pathname.includes('/gp/product/')) {
          // Formato /gp/product/{ASIN}
          const productIndex = pathParts.indexOf('product');
          if (productIndex !== -1 && productIndex + 1 < pathParts.length) {
            const asin = pathParts[productIndex + 1];
            // Construir URL limpia con solo el ASIN
            return `https://${urlObj.hostname}/gp/product/${asin}`;
          }
        }
        
        // Si no pudimos extraer un ASIN, al menos eliminar los parámetros de consulta
        return `https://${urlObj.hostname}${urlObj.pathname}`;
      }
      
      // Si no es una URL de Amazon o no pudimos procesarla, devolver la original
      return inputUrl;
    } catch (e) {
      console.error(`Error limpiando URL de Amazon: ${e}`);
      return inputUrl; // Devolver la URL original en caso de error
    }
  }
  
  router.get("/extract-metadata", async (req: Request, res) => {
    let url = req.query.url as string;
    
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }
    
    try {
      console.log(`Extrayendo metadatos de URL: ${url}`);
      
      // Manejar URLs acortadas de Amazon antes de procesar
      if (url.includes('amzn.eu/') || url.includes('amzn.to/')) {
        try {
          console.log(`🔄 Procesando URL acortada de Amazon: ${url}`);
          
          // En lugar de usar el método HEAD, usamos fetch con redirección automática
          // Esta aproximación es más confiable para URLs acortadas
          const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow', // Seguir redirecciones automáticamente
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
            }
          });
          
          // Obtener la URL final después de seguir todas las redirecciones
          if (response.ok) {
            const finalUrl = response.url;
            if (finalUrl && finalUrl !== url) {
              console.log(`✅ URL acortada redirige a: ${finalUrl}`);
              url = finalUrl; // Actualizar la URL para extraer metadatos del destino real
            }
          }
        } catch (error) {
          console.error(`❌ Error al seguir redirección de URL acortada: ${error}`);
          // Continuar con la URL original si hay error
        }
      }
      
      // Limpiar URL de Amazon si es necesario
      if (url.includes('amazon.')) {
        const originalUrl = url;
        url = cleanAmazonUrl(url);
        if (url !== originalUrl) {
          console.log(`🧹 URL de Amazon limpiada: ${originalUrl} -> ${url}`);
        }
      }
      
      // Procesamos todos los casos de manera genérica con nuestro sistema mejorado
      console.log(`Procesando metadatos para URL: ${url}`);
      
      // Usamos el sistema estándar para todos los casos
      const { getUrlMetadata } = await import('./metascraper');
      
      // Añadir timeout global para evitar bloqueos
      let metadata;
      try {
        // Crear una promesa con timeout
        const fetchWithTimeout = async (ms: number): Promise<any> => {
          return Promise.race([
            getUrlMetadata(url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout obteniendo metadatos')), ms)
            )
          ]);
        };
        
        metadata = await fetchWithTimeout(8000); // 8 segundos máximo
      } catch (error: any) {
        console.log(`Error con timeout al extraer metadatos: ${error.message}`);
        // Valores por defecto en caso de timeout
        metadata = { 
          imageUrl: "", 
          price: "", 
          title: "", 
          description: "" 
        };
        
        // Por motivos de timeout, procedemos con metadatos genéricos
        console.log("Timeout al obtener metadatos - procederemos con extracción genérica a partir de la URL");
      }
      
      // Si el título es &nbsp; (caso especial de Zara), forzamos a usar la URL
      if (metadata.title === '&nbsp;') {
        metadata.title = '';
      }
      
      // Comprobar y limpiar el título si existe
      if (metadata.title) {
        // Remover caracteres HTML y espacios
        metadata.title = metadata.title
          .replace(/&nbsp;/g, '')
          .replace(/&[a-z0-9]+;/g, ' ') // Reemplazar otras entidades HTML por espacios
          .trim();
      }
      
      // Extraer título y otros datos significativos a partir de la URL (método genérico)
      try {
        const urlObj = new URL(url);
        const pathStr = urlObj.pathname;
        
        // Si no tenemos título, extraerlo de la URL
        if (!metadata.title || metadata.title.trim().length < 3) {
          // Intentar extraer un título significativo con expresiones regulares
          const patterns = [
            /\/([a-z0-9-]+)-([a-z0-9-]+)/i,
            /\/([\w-]+)\/?$/i,
            /\/p\/([\w-]+)/i,
            /\/dp\/([\w-]+)/i,
          ];
          
          let foundTitle = false;
          for (const pattern of patterns) {
            const match = pathStr.match(pattern);
            if (match && match[1]) {
              let extractedTitle = match[0].replace(/^\//, '');
              // Limpiar y formatear
              metadata.title = extractedTitle
                .replace(/-/g, ' ')
                .replace(/\.\w+$/, '')
                .replace(/\/dp\//, '')
                .replace(/\/p\//, '')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              console.log(`Título extraído de URL: ${metadata.title}`);
              foundTitle = true;
              break;
            }
          }
        }
      } catch (e) {
        console.log('Error procesando URL:', e);
      }
      
      // Si no tenemos un título válido después de la limpieza, generamos uno a partir de la URL
      if (!metadata.title || metadata.title === '' || metadata.title.length < 3) {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
          if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            // Convertir algo como "zapatillas-running-nike-2023" a "Zapatillas Running Nike 2023"
            metadata.title = lastPart
              .replace(/-/g, ' ')
              .replace(/\.\w+$/, '') // Eliminar extensión de archivo si existe
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          } else {
            // Si no hay partes de la ruta, usar el dominio como título
            metadata.title = urlObj.hostname.replace(/^www\./i, '');
          }
        } catch (e) {
          console.log('Error extrayendo título de la URL:', e);
        }
      }
      
      // Asegurarnos de que hay una descripción aunque sea básica
      if (!metadata.description) {
        try {
          metadata.description = `Artículo encontrado en ${new URL(url).hostname.replace(/^www\./i, '')}`;
        } catch (e) {
          metadata.description = "Ver detalles del producto";
        }
      }
      
      console.log("Metadatos extraídos:", {
        imageUrl: metadata.imageUrl,
        price: metadata.price,
        title: metadata.title,
        description: metadata.description?.substring(0, 30) + "..."
      });
      
      res.json(metadata);
    } catch (error) {
      console.error('Error extrayendo metadatos:', error);
      res.status(500).json({ 
        message: "Error extracting metadata",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint simple de ping para mantener activa la sesión
  router.get("/ping", (req: Request, res: Response) => {
    // Si el usuario está autenticado, actualizar la marca de tiempo
    // de la cookie de sesión para mantenerla activa
    if (req.isAuthenticated()) {
      console.log(`Ping recibido: manteniendo sesión activa para usuario ${(req.user as any)?.id || 'desconocido'}`);
      
      // Tocar la sesión para renovar la cookie
      if (req.session) {
        req.session.touch();
      }
    }
    
    // Respuesta mínima para el cliente
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.use("/api", router);
  return httpServer;
}
