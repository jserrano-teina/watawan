import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useSharedWishlist } from '../hooks/useWishlist';
import SharedWishlistView from '../components/SharedWishlistView';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { Check, AlertCircle, Gift } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const SharedList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { owner, items, isLoading, reserveItem } = useSharedWishlist(id);
  
  const [toast, setToast] = useState<{ visible: boolean, message: string, variant: 'success' | 'error' | 'warning' | 'info' }>({ 
    visible: false, 
    message: '', 
    variant: 'success' 
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

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="p-6 text-center max-w-[500px] mx-auto">
          <div className="mx-auto w-60 h-60 mb-6 flex items-center justify-center">
            <img 
              src="/images/not_found.png" 
              alt="Lista no encontrada" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-bold text-2xl text-white mb-3">Lista no encontrada</h2>
          <p className="text-white/60 mb-6">El enlace que has seguido no corresponde a ninguna lista de deseos activa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-[#121212] text-white">
      <SharedWishlistView 
        owner={owner} 
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

export default SharedList;
