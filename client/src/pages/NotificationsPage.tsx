import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { WishItem, Reservation } from '@shared/schema';
import Header from '@/components/Header';
import { User } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from '@/components/ProductImage';
import { Loader2 } from 'lucide-react';

type NotificationItem = {
  item: WishItem;
  reservation: Reservation;
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Obtener todas las reservas
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['/api/reserved-items'],
    enabled: !!user,
  });
  
  // Mutación para marcar notificaciones como leídas
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-read', {});
      return res.json();
    },
    onSuccess: () => {
      // Invalidar la consulta de notificaciones no leídas para actualizar los contadores
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    }
  });
  
  // Marcar como leídas automáticamente al visitar la página
  useEffect(() => {
    if (user) {
      markAsReadMutation.mutate();
    }
  }, [user]);
  
  // Extraer ASIN/ID de producto de URLs de Amazon
  const getProductId = (url?: string): string | undefined => {
    if (!url) return undefined;
    
    // Extraer ASIN de URLs de Amazon
    if (url.includes('amazon')) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (asinMatch && asinMatch[1]) {
        return asinMatch[1];
      }
      
      // Intentar otro formato de URL de Amazon
      const altMatch = url.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (altMatch && altMatch[1]) {
        return altMatch[1];
      }
    }
    return undefined;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      <Header user={user as User} />
      
      <main className="flex-grow container mx-auto px-4 pb-24">
        <h1 className="text-2xl font-bold mt-4 mb-6">Notificaciones</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map(({ item, reservation }) => (
              <div key={reservation.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-[#222]">
                    <ProductImage 
                      imageUrl={item.imageUrl} 
                      productId={getProductId(item.purchaseLink)}
                      title={item.title}
                      purchaseLink={item.purchaseLink}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{item.title}</h3>
                    
                    <div className="text-green-500 flex items-center text-sm mt-1">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                      <p>Alguien ha reservado este regalo para ti</p>
                    </div>
                    
                    <p className="text-white/50 text-sm mt-2">
                      {formatDistanceToNow(new Date(reservation.reservedAt), { 
                        addSuffix: true,
                        locale: es
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#222] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-xl font-medium text-white/90">No hay notificaciones</h3>
            <p className="mt-2 text-white/50">Las reservas de tus deseos aparecerán aquí</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;