import React, { useState } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import ShareBanner from '../components/ShareBanner';
import WishItem from '../components/WishItem';
import EmptyWishlist from '../components/EmptyWishlist';
import FloatingActionButton from '../components/FloatingActionButton';
import BottomNavigation from '../components/BottomNavigation';
import AddWishModal from '../components/modals/AddWishModal';
import ShareModal from '../components/modals/ShareModal';
import WishDetailModal from '../components/modals/WishDetailModal';
import Header from '../components/Header';
import { WishItem as WishItemType } from '../types';
import { useToast } from '@/hooks/use-toast';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  const { user, wishlist, items, isLoading, addWishItem, updateWishItem, deleteWishItem } = useWishlist();
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishItemType | null>(null);
  const [itemToEdit, setItemToEdit] = useState<WishItemType | undefined>(undefined);
  const [toast, setToast] = useState<{ visible: boolean, message: string, variant: 'success' | 'error' | 'warning' | 'info' }>({ visible: false, message: '', variant: 'success' });

  // Ordenar los items con los más recientes primero
  const myWishItems = Array.isArray(items) 
    ? [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const handleAddWishClick = () => {
    setItemToEdit(undefined);
    setShowAddWishModal(true);
  };

  const handleEditWish = (item: WishItemType) => {
    // No permitir editar items reservados
    if (item.isReserved) {
      showToast('No se puede editar un deseo reservado', 'warning');
      return;
    }
    setItemToEdit(item);
    setShowAddWishModal(true);
  };

  const handleDeleteWish = async (item: WishItemType) => {
    try {
      await deleteWishItem.mutateAsync(item.id);
      showToast('Deseo eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error deleting wish:', error);
      showToast('Error al eliminar el deseo', 'error');
    }
  };

  const handleWishFormSubmit = async (data: any) => {
    try {
      if (itemToEdit) {
        await updateWishItem.mutateAsync({ id: itemToEdit.id, ...data });
        showToast('Deseo actualizado correctamente', 'success');
      } else {
        await addWishItem.mutateAsync(data);
        showToast('Deseo añadido correctamente', 'success');
      }
    } catch (error) {
      console.error('Error saving wish:', error);
      showToast('Error al guardar el deseo', 'error');
    }
  };
  
  // Variable para rastrear si una operación de Sheet se cerró recientemente
  const [sheetRecentlyClosed, setSheetRecentlyClosed] = useState(false);

  // Función para avisar al componente Home que un Sheet se cerró
  const handleSheetClosed = () => {
    setSheetRecentlyClosed(true);
    setTimeout(() => {
      setSheetRecentlyClosed(false);
    }, 300); // Prevenir clics por 300ms
  };
  
  const handleItemClick = (item: WishItemType) => {
    // Si un Sheet se cerró recientemente, ignorar el clic para prevenir eventos accidentales
    if (sheetRecentlyClosed) {
      console.log('Ignorando clic de detalle, sheet recientemente cerrado');
      return;
    }
    
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const showToast = (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'success') => {
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

  return (
    <div className="flex flex-col min-h-screen relative bg-[#121212] text-white">
      <Header user={user} />
      <main className="flex-grow container mx-auto px-4 pb-24">
        {myWishItems.length > 0 && (
          <ShareBanner onShareClick={() => setShowShareModal(true)} />
        )}
        
        {myWishItems.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-6 text-white">Mis deseos</h2>
            <div className="grid gap-2">
              {myWishItems.map(item => (
                <WishItem 
                  key={item.id} 
                  item={item} 
                  onEdit={handleEditWish} 
                  onDelete={handleDeleteWish}
                  onClick={handleItemClick}
                  onSheetClose={handleSheetClosed}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[80vh]">
            <EmptyWishlist onAddWish={handleAddWishClick} />
          </div>
        )}
      </main>
      
      {myWishItems.length > 0 && (
        <FloatingActionButton onClick={handleAddWishClick} />
      )}
      
      <BottomNavigation />
      
      <AddWishModal 
        isOpen={showAddWishModal}
        onClose={() => setShowAddWishModal(false)}
        onSubmit={handleWishFormSubmit}
        itemToEdit={itemToEdit}
      />
      
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareableLink={wishlist?.shareableLink || ''}
      />

      <WishDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        item={selectedItem}
        onEdit={handleEditWish}
        onDelete={handleDeleteWish}
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

export default Home;
