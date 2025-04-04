import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../lib/queryClient';
import { WishItem, Wishlist, User } from '../types';

// Función de utilidad para invalidar todas las consultas relacionadas con items y notificaciones
function invalidateAllItemQueries(queryClient: ReturnType<typeof useQueryClient>) {
  // Usamos un enfoque más específico y controlado de invalidación
  
  // Invalidar consultas de wishlist (incluidas todas las sublistas)
  queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
  
  // Invalidar la lista de items de cualquier wishlist
  queryClient.invalidateQueries({ queryKey: ['/api/wishlist', 'items'] });
  
  // Invalidar listas compartidas
  queryClient.invalidateQueries({ queryKey: ['/api/wishlist/shared'] });
  
  // Invalidar reservas y notificaciones
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
    queryKey: ['/api/wishlist', wishlist?.id, 'items'],
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
      // Invalidamos todas las consultas para asegurar que el nuevo elemento aparezca
      invalidateAllItemQueries(qc);
      
      // También actualizamos directamente el caché con el nuevo elemento
      qc.setQueryData<WishItem[]>(
        ['/api/wishlist', wishlist?.id, 'items'],
        (oldItems = []) => {
          // Asegurarnos de que el nuevo item no esté ya en la lista
          const existingItemIndex = oldItems.findIndex(item => item.id === newItem.id);
          
          if (existingItemIndex !== -1) {
            // Reemplazar el item existente
            return oldItems.map(item => 
              item.id === newItem.id ? newItem : item
            );
          } else {
            // Añadir el nuevo item al principio de la lista
            return [newItem, ...oldItems];
          }
        }
      );
    },
  });

  // Update wish item mutation
  const updateWishItem = useMutation({
    mutationFn: async ({ id, ...data }: WishFormData & { id: number }) => {
      const res = await apiRequest('PUT', `/api/wishlist/items/${id}`, data);
      return res.json();
    },
    onSuccess: (updatedItem) => {
      // Invalidamos todas las consultas para asegurar que los cambios se reflejen
      invalidateAllItemQueries(qc);
      
      // También actualizamos directamente el caché con el item actualizado
      qc.setQueryData<WishItem[]>(
        ['/api/wishlist', wishlist?.id, 'items'],
        (oldItems = []) => {
          return oldItems.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          );
        }
      );
    },
  });

  // Delete wish item mutation
  const deleteWishItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/wishlist/items/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Invalidamos todas las consultas para asegurar que los cambios se reflejen
      invalidateAllItemQueries(qc);
      
      // También eliminamos el item del caché directamente
      qc.setQueryData<WishItem[]>(
        ['/api/wishlist', wishlist?.id, 'items'],
        (oldItems = []) => {
          return oldItems.filter(item => item.id !== deletedId);
        }
      );
    },
  });
  
  // Mark item as received mutation
  const markAsReceived = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${id}/received`);
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidamos todas las consultas relevantes para asegurar actualización global
      invalidateAllItemQueries(qc);
      
      // También podemos actualizar directamente el caché con el nuevo estado del item
      qc.setQueryData<WishItem[]>(
        ['/api/wishlist', wishlist?.id, 'items'], 
        (oldItems = []) => {
          return oldItems.map(item => 
            item.id === data.id ? { ...item, isReceived: true } : item
          );
        }
      );
    },
  });
  
  // Unreserve item mutation
  const unreserveItem = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${id}/unreserve`);
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidamos todas las consultas relevantes para asegurar actualización global
      invalidateAllItemQueries(qc);
      
      // También podemos actualizar directamente el caché con el nuevo estado del item
      qc.setQueryData<WishItem[]>(
        ['/api/wishlist', wishlist?.id, 'items'], 
        (oldItems = []) => {
          return oldItems.map(item => 
            item.id === data.id ? { ...item, isReserved: false, reservedBy: undefined, reserverName: undefined } : item
          );
        }
      );
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
    queryKey: ['/api/wishlist/shared', shareableLink],
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
    queryKey: ['/api/wishlist/shared', shareableLink, 'items'],
    enabled: !!shareableLink,
  });

  // Reserve item mutation
  const reserveItem = useMutation({
    mutationFn: async ({ itemId, reserverName }: { itemId: number; reserverName: string }) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${itemId}/reserve`, { reserverName });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidamos no solo los items de la lista compartida sino también cualquier 
      // otra consulta relacionada con items para que el propietario vea la actualización
      invalidateAllItemQueries(qc);
      
      // Actualizamos directamente el caché de la lista compartida con el nuevo estado
      qc.setQueryData<WishItem[]>(
        ['/api/wishlist/shared', shareableLink, 'items'], 
        (oldItems = []) => {
          return oldItems.map(item => 
            item.id === data.wishItemId ? 
              { ...item, isReserved: true, reservedBy: data.id, reserverName: data.reserverName } : 
              item
          );
        }
      );
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
