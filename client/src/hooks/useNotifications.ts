import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { WishItem, Reservation } from '@shared/schema';
import { useAuth } from './use-auth';

type NotificationItem = {
  item: WishItem;
  reservation: Reservation;
};

export function useNotifications() {
  const { user } = useAuth();
  
  // Obtener notificaciones no leídas
  const { 
    data: unreadNotifications = [], 
    isLoading: unreadLoading,
    error: unreadError,
  } = useQuery<NotificationItem[]>({
    queryKey: ['/api/notifications/unread'],
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minuto
  });
  
  // Obtener todas las notificaciones
  const { 
    data: allNotifications = [], 
    isLoading: allLoading,
    error: allError,
  } = useQuery<NotificationItem[]>({
    queryKey: ['/api/reserved-items'],
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minuto
  });
  
  // Marcar notificaciones como leídas
  const markAsRead = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-read', {});
      return res.json();
    },
    onSuccess: () => {
      // Invalidar la consulta de notificaciones no leídas
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
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