import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useSharedWishlist } from '../hooks/useWishlist';
import SharedWishlistView from '../components/SharedWishlistView';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { CheckCircle, AlertCircle } from 'lucide-react';

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
        <div className="animate-pulse text-xl text-white/80">Cargando...</div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="bg-[#1a1a1a] text-white rounded-lg border border-[#333] shadow-xl p-6 text-center max-w-md mx-4">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-red-500 h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Lista no encontrada</h2>
          <p className="text-white/70">El enlace que has seguido no corresponde a ninguna lista de deseos activa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-[#121212] text-white">
      <header className="sticky top-0 bg-[#121212] border-b border-[#333] shadow-sm z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary/20 mr-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="3" y="8" width="18" height="12" rx="2" ry="2"></rect>
                <path d="M20.3333 8H3.66667C3.29848 8 3 7.76278 3 7.47059V6.52941C3 6.23722 3.29848 6 3.66667 6H20.3333C20.7015 6 21 6.23722 21 6.52941V7.47059C21 7.76278 20.7015 8 20.3333 8Z"></path>
                <path d="M4 6V4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V6"></path>
                <path d="M12 22V8"></path>
                <path d="M8 12H16"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">
              Wishify
            </h1>
          </div>
        </div>
      </header>
      
      <SharedWishlistView 
        owner={owner} 
        items={items || []} 
        onReserveItem={handleReserveItem} 
      />
      
      {toast.visible && (
        <ToastContainer>
          <Toast visible={true} variant={toast.variant}>
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
      )}
    </div>
  );
};

export default SharedList;
