import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { User, WishItem } from '../types';
import SharedWishlistView from '../components/SharedWishlistView';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { Check, AlertCircle } from 'lucide-react';

interface UserProfileData {
  user: {
    id: number;
    email: string;
    displayName?: string;
    initials?: string;
    avatar?: string;
  };
  wishlist: {
    id: number;
    name: string | null;
  };
  items: WishItem[];
}

const UserProfilePublic = () => {
  const { username } = useParams<{ username: string }>();
  
  // Estado para los toasts
  const [toast, setToast] = useState<{ visible: boolean, message: string, variant: 'success' | 'error' | 'warning' | 'info' }>({ 
    visible: false, 
    message: '', 
    variant: 'success' 
  });

  // Mostrar un toast con mensaje y tipo
  const showToast = (message: string, variant: 'success' | 'error') => {
    setToast({ visible: true, message, variant });
    
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Consultar datos del perfil público del usuario
  const { data, isLoading, error } = useQuery<UserProfileData>({
    queryKey: [`/api/user/${username}/public`],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/user/${username}/public`);
        if (!res.ok) {
          throw new Error('Failed to fetch user profile');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    }
  });

  // Mutación para reservar un item
  const reserveItem = async (itemId: number, reserverName: string): Promise<void> => {
    try {
      const res = await apiRequest('POST', `/api/wishlist/items/${itemId}/reserve`, {
        reserverName
      });
      
      if (!res.ok) {
        throw new Error('Error al reservar el regalo');
      }
      
      showToast('¡Regalo reservado correctamente!', 'success');
    } catch (error) {
      console.error('Error reserving item:', error);
      showToast('Error al reservar el regalo', 'error');
    }
  };

  // Estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <div className="text-white/80 text-lg">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  // Error o datos no encontrados
  if (error || !data) {
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

  // Renderizar la vista de la lista de deseos
  return (
    <div className="flex flex-col min-h-screen relative bg-[#121212] text-white">
      <SharedWishlistView 
        owner={data.user}
        items={data.items || []} 
        onReserveItem={reserveItem} 
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

export default UserProfilePublic;