import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { WishItem, Reservation } from '@/types';
import { useAuth } from './use-auth';

type NotificationItem = {
  item: WishItem;
  reservation: Reservation;
};

export function useNotifications() {
  const { user } = useAuth();
  
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
  
  // Marcar notificaciones como leídas
  const markAsRead = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-read', {});
      return res.json();
    },
    onSuccess: () => {
      // Cuando se marcan como leídas, invalidamos todas las consultas relacionadas
      // para asegurarnos de que los estados se actualizan en todas las vistas
      invalidateAllAppQueries();
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