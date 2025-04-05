import React, { useState, useEffect } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import ShareBanner from '../components/ShareBanner';
import WishItem from '../components/WishItem';
import EmptyWishlist from '../components/EmptyWishlist';
import FloatingActionButton from '../components/FloatingActionButton';
import BottomNavigation from '../components/BottomNavigation';
import AddWishModal from '../components/modals/AddWishModal';
import ShareModal from '../components/modals/ShareModal';
import WishDetailModal from '../components/modals/WishDetailModal';
import { ReceivedConfirmationSheet } from '../components/modals/ReceivedConfirmationSheet';
import { UnreserveConfirmationSheet } from '../components/modals/UnreserveConfirmationSheet';
import Header from '../components/Header';
import { WishItem as WishItemType } from '../types';
import { useToast } from '@/hooks/use-toast';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

const Home: React.FC = () => {
  const { user, wishlist, items, isLoading, addWishItem, updateWishItem, deleteWishItem, markAsReceived, unreserveItem } = useWishlist();
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceivedSheet, setShowReceivedSheet] = useState(false);
  const [showUnreserveSheet, setShowUnreserveSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishItemType | null>(null);
  const [itemToEdit, setItemToEdit] = useState<WishItemType | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean, message: string, variant: 'success' | 'error' | 'warning' | 'info' }>({ visible: false, message: '', variant: 'success' });

  // Ordenar los items según los criterios actualizados:
  // 1. Primero los no recibidos, luego los recibidos
  // 2. Dentro de cada grupo, ordenamos por fecha de creación (más nuevos primero)
  const myWishItems = Array.isArray(items) && items.length > 0
    ? [...items].sort((a, b) => {
        // 1. Primero por estado de recibido
        if (a.isReceived !== b.isReceived) {
          return a.isReceived ? 1 : -1; // No recibidos primero
        }
        
        // 2. Finalmente por fecha de creación
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Más nuevos primero
      })
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
    // Activar el estado de carga
    setIsSaving(true);
    
    try {
      // Procesamos los datos antes de enviarlos
      const formattedData = {
        title: data.title?.trim() || 'Sin título',
        description: data.description?.trim() || '',
        purchaseLink: data.purchaseLink?.trim() || '',
        price: data.price || '',
        imageUrl: data.imageUrl || '',
      };
      
      // Console.log para debug
      console.log('Datos a enviar:', formattedData);
      
      if (itemToEdit) {
        // Ejecutar la actualización
        const result = await updateWishItem.mutateAsync({ 
          id: itemToEdit.id, 
          ...formattedData 
        });
        
        console.log('Deseo actualizado correctamente:', result);
        
        // Cerrar el modal solo después de completar la actualización
        setShowAddWishModal(false);
        showToast('Deseo actualizado correctamente', 'success');
      } else {
        // Ejecutar la creación
        const result = await addWishItem.mutateAsync(formattedData);
        
        console.log('Deseo añadido correctamente:', result);
        
        // Cerrar el modal solo después de completar la creación
        setShowAddWishModal(false);
        showToast('Deseo añadido correctamente', 'success');
      }
    } catch (error: any) {
      // Log detallado del error para facilitar la depuración
      console.error('Error saving wish:', error);
      console.error('Error details:', error.message || 'Error desconocido');
      
      // Mostrar un toast con más información si está disponible
      showToast(`Error al guardar el deseo: ${error.message || 'Error desconocido'}`, 'error');
      
      // Importante: no cerramos el modal en caso de error para que el usuario pueda corregir
    } finally {
      // Dar un pequeño tiempo antes de ocultar el loader
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  };
  
  // Efecto para monitorear cambios en la lista de items
  useEffect(() => {
    if (Array.isArray(items)) {
      console.log(`Items actualizados: ${items.length} elementos en la lista`);
    }
  }, [items]);

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
  
  const handleMarkAsReceived = (itemId: number) => {
    const item = items?.find((item) => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      setShowReceivedSheet(true);
    }
  };
  
  const handleUnreserve = (itemId: number) => {
    const item = items?.find((item) => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      setShowUnreserveSheet(true);
    }
  };
  
  const handleConfirmUnreserve = async () => {
    if (selectedItem) {
      try {
        await unreserveItem.mutateAsync(selectedItem.id);
        showToast('Regalo desmarcado como reservado', 'success');
        setShowUnreserveSheet(false);
        setShowDetailModal(false); // Cerrar el modal de detalle también
      } catch (error) {
        console.error('Error unreserving item:', error);
        showToast('Error al desmarcar el regalo como reservado', 'error');
      }
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
      {/* Overlay de carga durante el guardado */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#1e1e1e] rounded-xl p-6 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      )}
      
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
                  onMarkAsReceived={handleMarkAsReceived}
                  onUnreserve={handleUnreserve}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-180px)] mt-10">
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
        onMarkAsReceived={handleMarkAsReceived}
        onUnreserve={handleUnreserve}
      />
      
      <ReceivedConfirmationSheet
        isOpen={showReceivedSheet}
        onClose={() => setShowReceivedSheet(false)}
        item={selectedItem}
        markAsReceivedMutation={markAsReceived}
      />
      
      <UnreserveConfirmationSheet
        isOpen={showUnreserveSheet}
        onClose={() => setShowUnreserveSheet(false)}
        onConfirm={handleConfirmUnreserve}
        item={selectedItem}
      />
      
      {toast.visible && (
        <ToastContainer>
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

export default Home;
