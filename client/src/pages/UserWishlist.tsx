import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { WishItem } from '../types';
import SharedWishlistView from '../components/SharedWishlistView';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

/**
 * Componente para mostrar la lista de deseos de un usuario accedida desde
 * la URL pública watawan.com/user/[username]
 */
const UserWishlist: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [toast, setToast] = useState<{ visible: boolean, message: string, variant: 'success' | 'error' | 'warning' | 'info' }>({ 
    visible: false, 
    message: '', 
    variant: 'success' 
  });

  // Buscar la wishlist directamente con el nuevo endpoint (usando la URL amigable)
  const { data: wishlistData, isLoading: wishlistLoading, error: wishlistError } = useQuery({
    queryKey: [`/api/user/${username}/wishlist`],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/user/${username}/wishlist`);
        return res.json();
      } catch (err) {
        console.error('Error fetching wishlist by username:', err);
        throw err;
      }
    }
  });

  // Buscar los items de la wishlist usando el nuevo endpoint
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery<WishItem[]>({
    queryKey: [`/api/user/${username}/items`],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/user/${username}/items`);
        return res.json();
      } catch (err) {
        console.error('Error fetching wishlist items:', err);
        throw err;
      }
    },
    enabled: !!wishlistData?.wishlist // Solo habilitamos esta consulta si hemos encontrado la wishlist
  });

  // Mutación para reservar un item
  const reserveItem = useMutation({
    mutationFn: async ({ itemId, reserverName }: { itemId: number; reserverName: string }) => {
      const res = await apiRequest('POST', `/api/wishlist/items/${itemId}/reserve`, { reserverName });
      return res.json();
    },
    onSuccess: () => {
      // No necesitamos invalidar consultas aquí, ya que el servidor lo maneja a través del hook useSharedWishlist
    },
  });

  const handleReserveItem = async (itemId: number, reserverName: string): Promise<void> => {
    try {
      await reserveItem.mutateAsync({ itemId, reserverName });
      showToast('¡Regalo reservado correctamente!', 'success');
    } catch (error) {
      console.error('Error reserving item:', error);
      showToast('Error al reservar el regalo', 'error');
    }
  };

  const showToast = (message: string, variant: 'success' | 'error') => {
    setToast({ visible: true, message, variant });
    
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Verificar si hay errores o si está cargando
  const isLoading = wishlistLoading || itemsLoading;
  const hasError = wishlistError || itemsError;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <div className="text-white/80 text-lg">Cargando lista de deseos...</div>
        </div>
      </div>
    );
  }

  if (hasError || !wishlistData?.wishlist || !wishlistData?.owner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="p-6 text-center max-w-[500px] mx-auto">
          <div className="mx-auto w-60 h-60 mb-6 flex items-center justify-center">
            <img 
              src="/images/not_found.png" 
              alt="Usuario no encontrado" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-bold text-2xl text-white mb-3">Usuario no encontrado</h2>
          <p className="text-white/60 mb-6">El usuario que buscas no existe o no tiene una lista de deseos pública.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="p-6 text-center max-w-[500px] mx-auto">
          <div className="mx-auto w-60 h-60 mb-6 flex items-center justify-center">
            <img 
              src="/images/not_found.png" 
              alt="Lista vacía" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-bold text-2xl text-white mb-3">Lista vacía</h2>
          <p className="text-white/60 mb-6">Este usuario no tiene elementos en su lista de deseos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-[#121212] text-white">
      <SharedWishlistView 
        owner={wishlistData.owner} 
        items={items || []} 
        onReserveItem={handleReserveItem} 
      />
      
      {toast.visible && (
        <ToastContainer className="z-[100]">
          <Toast visible={true} variant={toast.variant}>
            <div className="flex items-center">
              {toast.variant === 'success' ? (
                <Check className="mr-2 h-6 w-6 text-green-400" />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4" />
              )}
              <span className="text-white font-medium">{toast.message}</span>
            </div>
          </Toast>
        </ToastContainer>
      )}
    </div>
  );
};

export default UserWishlist;