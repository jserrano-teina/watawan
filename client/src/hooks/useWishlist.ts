import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryClient, apiRequest, invalidateAllAppQueries } from '../lib/queryClient';
import { WishItem, Wishlist, User } from '../types';

// Se eliminó la función local de invalidación de consultas
// en favor de la función global invalidateAllAppQueries desde queryClient.ts

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
      // Usamos la estrategia de invalidación global para todos los tipos de mutaciones
      console.log('Deseo añadido, invalidando todas las consultas');
      invalidateAllAppQueries(wishlist?.id);
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
      invalidateAllAppQueries(wishlist?.id);
    },
  });

  // Delete wish item mutation
  const deleteWishItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/wishlist/items/${id}`);
    },
    onSuccess: () => {
      // Invalidamos todas las consultas para asegurar que los cambios se reflejen
      invalidateAllAppQueries(wishlist?.id);
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
      invalidateAllAppQueries(wishlist?.id);
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
      invalidateAllAppQueries(wishlist?.id);
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
    onSuccess: (updatedItem) => {
      // Invalidamos todas las consultas relacionadas con listas de deseos
      invalidateAllAppQueries(updatedItem?.wishlistId);
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
