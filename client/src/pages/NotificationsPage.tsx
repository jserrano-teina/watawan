import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Header from '@/components/Header';
import { User, WishItem, Reservation } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from '@/components/ProductImage';
import { Loader2, Bell } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import WishDetailModal from '@/components/modals/WishDetailModal';
import { ReceivedConfirmationSheet } from '@/components/modals/ReceivedConfirmationSheet';
import { UnreserveConfirmationSheet } from '@/components/modals/UnreserveConfirmationSheet';

type NotificationItem = {
  item: WishItem;
  reservation: Reservation;
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<WishItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showReceivedSheet, setShowReceivedSheet] = useState(false);
  
  // Obtener todas las reservas
  const { data: rawNotifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/reserved-items'],
    enabled: !!user,
  });
  
  // Adaptar los datos para que coincidan con los tipos del frontend
  const notifications: NotificationItem[] = rawNotifications.length ? rawNotifications.map(({ item, reservation }) => ({
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
  
  // Mutación para marcar un item como recibido
  const markAsReceived = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${itemId}/received`, {});
      return res.json();
    },
    onSuccess: () => {
      // Cerrar el sheet y refrescar los datos
      setShowReceivedSheet(false);
      // Refrescar los datos de reservas y notificaciones
      queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    }
  });
  
  // Función para abrir el detalle del deseo
  const handleOpenDetail = (item: WishItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };
  
  // Función para manejar marcar como recibido
  const handleMarkAsReceived = (itemId: number) => {
    const item = notifications.find((n) => n.item.id === itemId)?.item;
    if (item) {
      setSelectedItem(item);
      setShowReceivedSheet(true);
    }
  };
  
  // Mutación para desmarcar un item como reservado
  const unreserveMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${itemId}/unreserve`, {});
      return res.json();
    },
    onSuccess: () => {
      // Cerrar el modal y refrescar los datos
      setDetailModalOpen(false);
      // Refrescar los datos de reservas y notificaciones
      queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      // También refrescamos las listas por si estamos mostrando el item en otra página
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    }
  });
  
  // Función para manejar desmarcar como reservado
  const handleUnreserve = (itemId: number) => {
    unreserveMutation.mutate(itemId);
  };
  
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
        {/* Mostramos el título solo cuando hay notificaciones */}
        {notifications.length > 0 && (
          <h1 className="text-2xl font-bold mt-8 mb-6">Notificaciones</h1>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(({ item, reservation }) => (
              <div 
                key={reservation.id} 
                className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] cursor-pointer active:bg-[#222]"
                onClick={() => handleOpenDetail(item)}
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0 bg-[#222]" style={{ borderRadius: '6px' }}>
                    <ProductImage 
                      imageUrl={item.imageUrl} 
                      productId={getProductId(item.purchaseLink)}
                      title={item.title}
                      purchaseLink={item.purchaseLink}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm">
                      <p className="text-white">¡Alguien ha reservado <span className="font-semibold">{item.title}</span> para regalarte!</p>
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
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6 text-center max-w-md mx-auto">
            {/* Imagen de notificaciones */}
            <div className="mx-auto w-64 h-64 mb-6 flex items-center justify-center">
              <img 
                src="/images/notifications-empty.png" 
                alt="Notificaciones" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="font-bold text-2xl text-white mb-3">No hay notificaciones</h2>
            <p className="text-white/60 mb-6">Cuando alguien reserve uno de tus deseos, recibirás una notificación aquí</p>
          </div>
        )}
      </main>
      
      <BottomNavigation />
      
      {selectedItem && (
        <WishDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          item={selectedItem}
          onEdit={() => {}}
          onDelete={() => {}}
          onMarkAsReceived={handleMarkAsReceived}
          onUnreserve={handleUnreserve}
        />
      )}
      
      {/* El UnreserveConfirmationSheet ya está manejado por el WishDetailModal */}
      
      <ReceivedConfirmationSheet
        isOpen={showReceivedSheet}
        onClose={() => setShowReceivedSheet(false)}
        item={selectedItem}
        markAsReceivedMutation={markAsReceived}
      />
    </div>
  );
};

export default NotificationsPage;