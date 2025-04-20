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
import { useScrollLock } from '@/hooks/useScrollLock';

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
        // Verificación adicional si la wishlist no está disponible
        if (!wishlist || !wishlist.id) {
          console.log('⚠️ Se va a añadir un deseo sin wishlist confirmada en el estado', 
            'La función en useWishlist intentará recuperarla automáticamente');
        }
        
        // Ejecutar la creación con manejo mejorado de errores
        let retryCount = 0;
        const maxRetries = 2;
        
        const attemptAddWish = async (): Promise<any> => {
          try {
            return await addWishItem.mutateAsync(formattedData);
          } catch (e) {
            // Capturar específicamente errores relacionados con "No wishlist found"
            const error = e as Error;
            if (retryCount < maxRetries && 
                (error.message.includes('No wishlist found') || 
                 error.message.includes('No se pudo obtener o crear una wishlist'))) {
              
              retryCount++;
              console.log(`Reintentando añadir deseo (intento ${retryCount}/${maxRetries})...`);
              
              // Pequeña pausa antes de reintentar
              await new Promise(resolve => setTimeout(resolve, 1000));
              return attemptAddWish();
            }
            throw error;
          }
        };
        
        // Intentar añadir el deseo con reintentos automáticos
        const result = await attemptAddWish();
        console.log('Deseo añadido correctamente:', result);
        
        // Cerrar el modal solo después de completar la creación
        setShowAddWishModal(false);
        showToast('Deseo añadido correctamente', 'success');
      }
    } catch (error: any) {
      // Log detallado del error para facilitar la depuración
      console.error('Error saving wish:', error);
      console.error('Error details:', error.message || 'Error desconocido');
      
      // Mensajes más amigables para el usuario según el tipo de error
      let errorMessage: string;
      
      if (error.message?.includes('No wishlist found') || 
          error.message?.includes('No se pudo obtener o crear una wishlist')) {
        errorMessage = 'No pudimos encontrar tu lista de deseos. Por favor, recarga la aplicación e inténtalo de nuevo.';
      } else if (error.message?.includes('401') || error.message?.includes('No autenticado')) {
        errorMessage = 'Tu sesión ha caducado. Por favor, inicia sesión de nuevo.';
      } else if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Parece que hay problemas de conexión. Verifica tu red e inténtalo de nuevo.';
      } else {
        errorMessage = error.message || 'Ocurrió un error inesperado';
      }
      
      // Mostrar un toast con más información si está disponible
      showToast(`Error al guardar el deseo: ${errorMessage}`, 'error');
      
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
  
  // Bloquear el scroll del body cuando hay modales abiertos
  useScrollLock(showDetailModal || showAddWishModal || showShareModal || showReceivedSheet || showUnreserveSheet);

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

  // Cuando está cargando, devolvemos un div vacío para que solo se muestre el splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212]"></div>
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
      {/* Contenido principal - cambia su comportamiento según haya items o no */}
      {myWishItems.length > 0 ? (
        // Si hay items, mantenemos el scroll
        <main className="flex-grow container mx-auto px-4 pb-32 max-w-[500px] overflow-y-auto scrollable-container overscroll-none" 
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            height: 'calc(100vh - 56px)', 
            paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' 
          }}>
          <ShareBanner onShareClick={() => setShowShareModal(true)} />
          
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
        </main>
      ) : (
        // Si no hay items, eliminamos el scroll y centramos perfectamente en el medio
        <main className="flex-grow container mx-auto px-4 max-w-[500px] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center transform -translate-y-[45px]">
            <EmptyWishlist onAddWish={handleAddWishClick} />
          </div>
        </main>
      )}
      
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
