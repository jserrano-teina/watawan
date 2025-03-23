import React, { useState } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import Header from '../components/Header';
import WishlistTabs from '../components/WishlistTabs';
import ShareBanner from '../components/ShareBanner';
import WishItem from '../components/WishItem';
import EmptyWishlist from '../components/EmptyWishlist';
import BottomNavigation from '../components/BottomNavigation';
import FloatingActionButton from '../components/FloatingActionButton';
import AddWishModal from '../components/modals/AddWishModal';
import ShareModal from '../components/modals/ShareModal';
import { WishItem as WishItemType } from '../types';
import { useToast } from '@/hooks/use-toast';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

type TabType = 'wishes' | 'reserved';

const Home: React.FC = () => {
  const { user, wishlist, items, isLoading, addWishItem, updateWishItem, deleteWishItem } = useWishlist();
  const [activeTab, setActiveTab] = useState<TabType>('wishes');
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<WishItemType | undefined>(undefined);
  const [toast, setToast] = useState<{ visible: boolean, message: string, variant: 'success' | 'error' | 'warning' | 'info' }>({ visible: false, message: '', variant: 'success' });

  const myWishItems = Array.isArray(items) ? items : [];
  // In a real app, reserved items would come from another API endpoint
  const reservedItems: WishItemType[] = [];

  const handleAddWishClick = () => {
    setItemToEdit(undefined);
    setShowAddWishModal(true);
  };

  const handleEditWish = (item: WishItemType) => {
    setItemToEdit(item);
    setShowAddWishModal(true);
  };

  const handleDeleteWish = async (item: WishItemType) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      try {
        await deleteWishItem.mutateAsync(item.id);
        showToast('Deseo eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error deleting wish:', error);
        showToast('Error al eliminar el deseo', 'error');
      }
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
      
      <main className="flex-grow container mx-auto px-4 pb-20">
        <WishlistTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'wishes' && (
          <>
            <ShareBanner onShareClick={() => setShowShareModal(true)} />
            
            <div className="my-6">
              <h2 className="text-2xl font-semibold mb-6 text-white">Mis deseos</h2>
              
              {myWishItems.length === 0 ? (
                <EmptyWishlist onAddWish={handleAddWishClick} />
              ) : (
                <div className="grid gap-4">
                  {myWishItems.map(item => (
                    <WishItem 
                      key={item.id} 
                      item={item} 
                      onEdit={handleEditWish} 
                      onDelete={handleDeleteWish} 
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'reserved' && (
          <div className="my-6">
            <h2 className="text-2xl font-semibold mb-6 text-white">Reservados para ti</h2>
            
            {reservedItems.length === 0 ? (
              <div className="card-airbnb p-6 text-center my-4">
                <div className="mx-auto w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4">
                  <i className="far fa-calendar-check text-2xl text-white/70"></i>
                </div>
                <h3 className="font-medium text-lg text-white">No tienes regalos reservados</h3>
                <p className="text-white/70 mt-2 mb-4">Comparte tu lista y tus amigos podrán reservar regalos para ti.</p>
                <button className="btn-airbnb" onClick={() => setShowShareModal(true)}>
                  Compartir Lista
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {reservedItems.map(item => (
                  <WishItem 
                    key={item.id} 
                    item={item} 
                    onEdit={() => {}} 
                    onDelete={() => {}} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddWishClick={handleAddWishClick}
      />
      
      <FloatingActionButton onClick={handleAddWishClick} />
      
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
