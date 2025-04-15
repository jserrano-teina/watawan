import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, invalidateAllAppQueries } from '@/lib/queryClient';
import { WishItem, Reservation } from '@/types';
import { useAuth } from './use-auth';
import { useEffect, useRef, useCallback } from 'react';

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
    refetch: refetchUnread,
  } = useQuery<any[]>({
    queryKey: ['/api/notifications/unread'],
    enabled: !!user,
    staleTime: 1000 * 20, // 20 segundos - reducido para detectar cambios más rápido
    refetchInterval: 5000, // Verificación agresiva cada 5 segundos
    refetchIntervalInBackground: false, // Solo verificar cuando la pestaña es visible
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
    
    // Si detectamos nuevas notificaciones o cualquier cambio en las notificaciones
    // Ahora actualizamos tanto al incrementar como al decrementar para asegurar
    // sincronización bidireccional
    if (currentUnreadCount !== prevUnreadCountRef.current) {
      console.log(`Cambio en notificaciones detectado: ${prevUnreadCountRef.current} → ${currentUnreadCount}`);
      
      // Usar nuestra función global de invalidación para una actualización completa
      // Esto garantiza que todas las vistas muestren el estado más reciente
      invalidateAllAppQueries();
    }
    
    // Actualizar la referencia para la próxima comparación
    prevUnreadCountRef.current = currentUnreadCount;
    
    // Forzar una verificación periódica proactiva para casos donde
    // el contador no cambió pero los items podrían haber sido modificados
    const checkTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetchUnread();
      }
    }, 10000); // Verificación de respaldo cada 10 segundos
    
    return () => clearInterval(checkTimer);
  }, [unreadNotifications.length, refetchUnread]);

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
  
  // Función para forzar una actualización manual de las notificaciones
  const forceRefresh = useCallback(() => {
    console.log('Forzando actualización manual de notificaciones');
    refetchUnread();
    invalidateAllAppQueries();
  }, [refetchUnread]);

  return {
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    allNotifications,
    isLoading: unreadLoading || allLoading,
    error: unreadError || allError,
    markAsRead,
    forceRefresh, // Exponemos la función para actualizaciones manuales
  };
}