import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, invalidateAllAppQueries } from '@/lib/queryClient';
import Header from '@/components/Header';
import { User, WishItem, Reservation } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from '@/components/ProductImage';
import OptimizedImage from '@/components/OptimizedImage';
import { Loader2, Bell } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import WishDetailModal from '@/components/modals/WishDetailModal';
import { ReceivedConfirmationSheet } from '@/components/modals/ReceivedConfirmationSheet';
import { UnreserveConfirmationSheet } from '@/components/modals/UnreserveConfirmationSheet';
import { useScrollLock } from '@/hooks/useScrollLock';

type NotificationItem = {
  item: WishItem;
  reservation: Reservation;
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<WishItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showReceivedSheet, setShowReceivedSheet] = useState(false);
  const [showUnreserveSheet, setShowUnreserveSheet] = useState(false);
  
  // Variable para rastrear si una operación de Sheet se cerró recientemente
  const [sheetRecentlyClosed, setSheetRecentlyClosed] = useState(false);
  
  // Bloquear el scroll del body cuando el modal de detalle está abierto
  useScrollLock(detailModalOpen || showReceivedSheet || showUnreserveSheet);
  
  // Función para avisar al componente que un Sheet se cerró
  const handleSheetClosed = () => {
    setSheetRecentlyClosed(true);
    setTimeout(() => {
      setSheetRecentlyClosed(false);
    }, 300); // Prevenir clics por 300ms
  };
  
  // Mutación para eliminar un item
  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest('DELETE', `/api/wishlist/items/${itemId}`, {});
      return res;
    },
    onSuccess: (_data, variables) => {
      console.log('Item eliminado correctamente, invalidando todas las consultas');
      // Cerrar el modal de detalle
      setDetailModalOpen(false);
      
      // Obtener el wishlistId del item eliminado
      const wishlistId = notifications.find(n => n.item.id === variables)?.item.wishlistId;
      
      // Invalidar todas las consultas de la aplicación
      invalidateAllAppQueries(wishlistId);
    }
  });
  
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
    onSuccess: (updatedItem) => {
      // Cerrar el sheet y refrescar los datos
      setShowReceivedSheet(false);
      
      console.log('Item marcado como recibido, invalidando todas las consultas relacionadas');
      
      // Usar la función de utilidad global para invalidar todas las consultas
      invalidateAllAppQueries(updatedItem?.wishlistId);
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
    onSuccess: (updatedItem) => {
      // Cerrar el modal y refrescar los datos
      setDetailModalOpen(false);
      
      console.log('Unreserve exitoso, invalidando todas las consultas relacionadas');
      
      // Usar la función de utilidad global para invalidar todas las consultas
      invalidateAllAppQueries(updatedItem?.wishlistId);
    }
  });
  
  // Función para manejar desmarcar como reservado
  const handleUnreserve = (itemId: number) => {
    const item = notifications.find((n) => n.item.id === itemId)?.item;
    if (item) {
      setSelectedItem(item);
      setShowUnreserveSheet(true);
    }
  };
  
  // Función para confirmar la acción de desmarcar como reservado
  const handleConfirmUnreserve = async () => {
    if (selectedItem) {
      try {
        await unreserveMutation.mutateAsync(selectedItem.id);
        setShowUnreserveSheet(false);
        setDetailModalOpen(false); // Cerrar el modal de detalle también
      } catch (error) {
        console.error('Error unreserving item:', error);
      }
    }
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
      
      {isLoading ? (
        // Estado de carga con spinner centrado
        <main className="fixed-height-container container mx-auto px-4 max-w-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      ) : notifications.length > 0 ? (
        // Si hay notificaciones, usamos la clase page-content para correcta gestión de scroll en PWA
        <main className="page-content container mx-auto px-4 max-w-[500px]">
          <h1 className="text-2xl font-bold mt-8 mb-6">Notificaciones</h1>
          
          <div className="space-y-3">
            {notifications.map(({ item, reservation }) => (
              <div 
                key={reservation.id} 
                className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333] cursor-pointer active:bg-[#222]"
                onClick={() => handleOpenDetail(item)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-[72px] h-[72px] rounded overflow-hidden flex-shrink-0 bg-[#222]" style={{ borderRadius: '6px' }}>
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
                      <p className="text-white text-base">¡Alguien ha reservado <span className="font-semibold">{item.title}</span> para regalarte!</p>
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
        </main>
      ) : (
        // Si no hay notificaciones, eliminamos el scroll y centramos perfectamente en el medio
        <main className="flex-grow container mx-auto px-4 max-w-[500px] flex items-center justify-center fixed-height-container">
          <div className="flex flex-col items-center justify-center transform translate-y-[20px]">
            {/* Imagen de notificaciones */}
            <div className="mx-auto w-60 h-60 mb-6 flex items-center justify-center">
              <OptimizedImage 
                src="/images/no_notifications.png" 
                alt="Notificaciones" 
                className="w-full h-full"
                objectFit="contain"
              />
            </div>
            <h2 className="font-bold text-2xl text-white mb-3 text-center">No hay notificaciones</h2>
            <p className="text-white/60 mb-6 text-center">Cuando alguien reserve uno de tus deseos, recibirás una notificación aquí</p>
          </div>
        </main>
      )}
      
      <BottomNavigation />
      
      {selectedItem && (
        <WishDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          item={selectedItem}
          onEdit={() => {}}
          onDelete={(item) => deleteMutation.mutate(item.id)}
          onMarkAsReceived={handleMarkAsReceived}
          onUnreserve={handleUnreserve}
        />
      )}
      
      {/* Sheet de confirmación para desmarcar como reservado */}
      <UnreserveConfirmationSheet
        isOpen={showUnreserveSheet}
        onClose={() => setShowUnreserveSheet(false)}
        onConfirm={handleConfirmUnreserve}
        item={selectedItem}
      />
      
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