import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useSharedWishlist } from '../hooks/useWishlist';
import SharedWishlistView from '../components/SharedWishlistView';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { CheckCircle, AlertCircle } from 'lucide-react';

const SharedList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { owner, items, isLoading, reserveItem } = useSharedWishlist(id);
  
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as const });

  const handleReserveItem = async (itemId: number, reserverName: string) => {
    try {
      await reserveItem.mutateAsync({ itemId, reserverName });
      showToast('¡Regalo reservado correctamente!', 'success');
      return true;
    } catch (error) {
      console.error('Error reserving item:', error);
      showToast('Error al reservar el regalo', 'error');
      return false;
    }
  };

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant });
    
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-neutral-600">Cargando...</div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-md mx-4">
          <div className="w-16 h-16 mx-auto bg-error/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-error h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Lista no encontrada</h2>
          <p className="text-neutral-600">El enlace que has seguido no corresponde a ninguna lista de deseos activa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-neutral-100">
      <header className="sticky top-0 bg-white shadow-sm z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-secondary">
              <i className="fas fa-gift text-primary mr-2"></i>Wishify
            </h1>
          </div>
        </div>
      </header>
      
      <SharedWishlistView 
        owner={owner} 
        items={items || []} 
        onReserveItem={handleReserveItem} 
      />
      
      <ToastContainer>
        <Toast visible={toast.visible} variant={toast.variant}>
          <div className="flex items-center">
            {toast.variant === 'success' ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4" />
            )}
            <span>{toast.message}</span>
          </div>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default SharedList;
