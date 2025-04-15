import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { WishItem, Reservation } from '@/types';
import { useAuth } from './use-auth';
import { useEffect, useRef } from 'react';

type NotificationItem = {
  item: WishItem;
  reservation: Reservation;
};

export function useNotifications() {
  const { user } = useAuth();
  
  // Referencia al último número de notificaciones no leídas detectadas
  const prevUnreadCountRef = useRef(0);
  
  // Obtener notificaciones no leídas
  const { 
    data: rawUnreadNotifications = [], 
    isLoading: unreadLoading,
    error: unreadError,
  } = useQuery<any[]>({
    queryKey: ['/api/notifications/unread'],
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minuto
  });
  
  // Adaptar las notificaciones no leídas al formato del frontend
  const unreadNotifications: NotificationItem[] = rawUnreadNotifications.length ? rawUnreadNotifications.map(({ item, reservation }) => ({
    item: {
      ...item,
      createdAt: item.createdAt?.toString() || new Date().toString(),
    },
    reservation: {
      ...reservation,
      reservedAt: reservation.reservedAt?.toString() || new Date().toString(),
    }
  })).sort((a, b) => {
    // Ordenar por fecha de reserva, de más reciente a más antigua
    return new Date(b.reservation.reservedAt).getTime() - new Date(a.reservation.reservedAt).getTime();
  }) : [];
  
  // Obtener todas las notificaciones
  const { 
    data: rawAllNotifications = [], 
    isLoading: allLoading,
    error: allError,
  } = useQuery<any[]>({
    queryKey: ['/api/reserved-items'],
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minuto
  });
  
  // Adaptar todas las notificaciones al formato del frontend
  const allNotifications: NotificationItem[] = rawAllNotifications.length ? rawAllNotifications.map(({ item, reservation }) => ({
    item: {
      ...item,
      createdAt: item.createdAt?.toString() || new Date().toString(),
    },
    reservation: {
      ...reservation,
      reservedAt: reservation.reservedAt?.toString() || new Date().toString(),
    }
  })).sort((a, b) => {
    // Ordenar por fecha de reserva, de más reciente a más antigua
    return new Date(b.reservation.reservedAt).getTime() - new Date(a.reservation.reservedAt).getTime();
  }) : [];
  
  // Efecto para detectar cambios en las notificaciones no leídas
  // y sincronizar el estado en tiempo real
  useEffect(() => {
    const currentUnreadCount = unreadNotifications.length;
    
    // Si detectamos nuevas notificaciones (más que antes)
    if (currentUnreadCount > prevUnreadCountRef.current) {
      console.log(`Se detectaron ${currentUnreadCount - prevUnreadCountRef.current} nuevas notificaciones`);
      
      // Invalidar todas las consultas relacionadas con wishlists para reflejar 
      // los cambios inmediatamente en todas las vistas
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      
      // Invalidar todos los items de wishlist para actualizar el estado reservado
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/items');
        }
      });
    }
    
    // Actualizar la referencia para la próxima comparación
    prevUnreadCountRef.current = currentUnreadCount;
  }, [unreadNotifications.length]);

  // Marcar notificaciones como leídas
  const markAsRead = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-read', {});
      return res.json();
    },
    onSuccess: () => {
      // Cuando se marcan como leídas, invalidamos todas las consultas relacionadas
      // para asegurarnos de que los estados se actualizan en todas las vistas
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
      
      // Invalidar también las listas de deseos para actualizar estado en todas las vistas
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/items');
        }
      });
    }
  });
  
  return {
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    allNotifications,
    isLoading: unreadLoading || allLoading,
    error: unreadError || allError,
    markAsRead,
  };
}