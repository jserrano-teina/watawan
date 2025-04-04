import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../lib/queryClient';
import { WishItem, Wishlist, User } from '../types';

// Función de utilidad para invalidar todas las consultas relacionadas con items y notificaciones
function invalidateAllItemQueries(queryClient: ReturnType<typeof useQueryClient>, wishlistId?: number) {
  // Aplicamos una estrategia de invalidación más amplia
  console.log('Invalidando todas las consultas de items y wishlist');
  
  // Invalidar consultas de wishlist (incluidas todas las sublistas)
  queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
  
  // Si tenemos un ID de wishlist, invalidamos específicamente los items de esa wishlist
  if (wishlistId) {
    console.log(`Invalidando específicamente los items del wishlist ${wishlistId}`);
    queryClient.invalidateQueries({ queryKey: [`/api/wishlist/${wishlistId}/items`] });
  } else {
    // Si no tenemos un ID específico, invalidamos todas las consultas relacionadas con /api/wishlist
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return typeof queryKey === 'string' && queryKey.includes('/api/wishlist');
      }
    });
  }
  
  // Invalidar explícitamente las otras rutas relacionadas
  queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
  queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
}

interface WishFormData {
  title: string;
  description?: string;
  purchaseLink: string;
  // imageUrl se obtiene automáticamente del enlace de compra
}

export function useWishlist() {
  // Acceder al cliente de consultas
  const qc = useQueryClient();
  
  // Get current user
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Get user's wishlist
  const { data: wishlist, isLoading: wishlistLoading } = useQuery<Wishlist>({
    queryKey: ['/api/wishlist'],
    enabled: !!user,
  });

  // Get wish items for the user's wishlist
  const { data: items = [], isLoading: itemsLoading } = useQuery<WishItem[]>({
    queryKey: [`/api/wishlist/${wishlist?.id}/items`],
    enabled: !!wishlist?.id,
  });

  // Add wish item mutation
  const addWishItem = useMutation({
    mutationFn: async (data: WishFormData) => {
      if (!wishlist) throw new Error('No wishlist found');

      const res = await apiRequest('POST', `/api/wishlist/${wishlist.id}/items`, data);
      return res.json();
    },
    onSuccess: (newItem) => {
      // Usamos la misma estrategia de invalidación completa para todos los tipos de mutaciones
      console.log('Deseo añadido, invalidando todas las consultas');
      invalidateAllItemQueries(qc, wishlist?.id);
    },
  });

  // Update wish item mutation
  const updateWishItem = useMutation({
    mutationFn: async ({ id, ...data }: WishFormData & { id: number }) => {
      const res = await apiRequest('PUT', `/api/wishlist/items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      // Invalidamos todas las consultas para asegurar que los cambios se reflejen
      invalidateAllItemQueries(qc, wishlist?.id);
    },
  });

  // Delete wish item mutation
  const deleteWishItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/wishlist/items/${id}`);
    },
    onSuccess: () => {
      // Invalidamos todas las consultas para asegurar que los cambios se reflejen
      invalidateAllItemQueries(qc, wishlist?.id);
    },
  });
  
  // Mark item as received mutation
  const markAsReceived = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${id}/received`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidamos todas las consultas relevantes para asegurar actualización global
      invalidateAllItemQueries(qc, wishlist?.id);
    },
  });
  
  // Unreserve item mutation
  const unreserveItem = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${id}/unreserve`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidamos todas las consultas relevantes para asegurar actualización global
      invalidateAllItemQueries(qc, wishlist?.id);
    },
  });

  return {
    user,
    wishlist,
    items,
    isLoading: userLoading || wishlistLoading || itemsLoading,
    addWishItem,
    updateWishItem,
    deleteWishItem,
    markAsReceived,
    unreserveItem,
  };
}

export function useSharedWishlist(shareableLink: string) {
  // Acceder al cliente de consultas
  const qc = useQueryClient();
  
  // Get shared wishlist and owner info
  const { data: sharedWishlistData, isLoading: sharedWishlistLoading } = useQuery({
    queryKey: [`/api/wishlist/shared/${shareableLink}`],
    queryFn: async () => {
      const res = await fetch(`/api/wishlist/shared/${shareableLink}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch shared wishlist');
      }
      return res.json();
    },
  });

  // Get wish items for the shared wishlist (using the dedicated endpoint for shared lists)
  const { data: items = [], isLoading: itemsLoading } = useQuery<WishItem[]>({
    queryKey: [`/api/wishlist/shared/${shareableLink}/items`],
    enabled: !!shareableLink,
  });

  // Reserve item mutation
  const reserveItem = useMutation({
    mutationFn: async ({ itemId, reserverName }: { itemId: number; reserverName: string }) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${itemId}/reserve`, { reserverName });
      return res.json();
    },
    onSuccess: () => {
      // Invalidamos no solo los items de la lista compartida sino también cualquier 
      // otra consulta relacionada con items para que el propietario vea la actualización
      invalidateAllItemQueries(qc);
      // También actualizamos específicamente la lista compartida actual
      queryClient.invalidateQueries({ queryKey: [`/api/wishlist/shared/${shareableLink}/items`] });
    },
  });

  return {
    owner: sharedWishlistData?.owner,
    wishlist: sharedWishlistData?.wishlist,
    items,
    isLoading: sharedWishlistLoading || itemsLoading,
    reserveItem,
  };
}
