import React, { useEffect, useState } from 'react';
import { WishItem } from '../../types';
import ProductImage from '../ProductImage';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, ExternalLink, Calendar, X, ArrowLeft, Check, CheckCheck, MoreVertical } from 'lucide-react';
import { 
  Sheet,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { ItemOptionsSheet } from './ItemOptionsSheet';
import { ReceivedConfirmationSheet } from './ReceivedConfirmationSheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeLink } from '@/components/ui/SafeLink';
import { SanitizedHTML } from '@/components/ui/SanitizedHTML';
import { sanitizeInput, sanitizeUrl } from '@/lib/sanitize';
import { apiRequest, invalidateAllAppQueries } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import useScrollLock from "@/hooks/useScrollLock";

interface WishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  onMarkAsReceived?: (itemId: number) => void;
  onUnreserve?: (itemId: number) => void;
}

const MobileView = ({ 
  item, 
  onClose, 
  onEdit, 
  onDelete,
  onMarkAsReceived,
  onUnreserve
}: {
  item: WishItem;
  onClose: () => void;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  onMarkAsReceived?: (itemId: number) => void;
  onUnreserve?: (itemId: number) => void;
}) => {
  const [openSheet, setOpenSheet] = useState(false);
  const [showReceivedConfirmation, setShowReceivedConfirmation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Mutation para marcar como recibido
  const markAsReceivedMutation = useMutation({
    mutationFn: async (itemId: number) => {
      // Utilizamos apiRequest para manejar CSRF adecuadamente
      const response = await apiRequest('POST', `/api/wishlist/items/${itemId}/received`, {});
      return response.json();
    },
    onSuccess: () => {
      console.log(`Item ${item.id} marcado como recibido - actualizando todas las vistas...`);
      
      // Utilizamos la función global de invalidación para asegurar una 
      // actualización completa y consistente en todas las vistas
      invalidateAllAppQueries(item.wishlistId);
      
      // Mostrar un mensaje de éxito al usuario
      toast?.({
        title: "¡Regalo recibido!",
        description: "Se ha marcado el elemento como recibido correctamente.",
        variant: "success"
      });
    }
  });
  
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { 
    addSuffix: true,
    locale: es
  });

  // Extraer ASIN de Amazon si está disponible
  const getProductId = (): string | undefined => {
    if (!item.purchaseLink) return undefined;
    
    // Extraer ASIN de URLs de Amazon
    if (item.purchaseLink.includes('amazon')) {
      const asinMatch = item.purchaseLink.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (asinMatch && asinMatch[1]) {
        return asinMatch[1];
      }
    }
    return undefined;
  };

  const productId = getProductId();

  // Función que maneja el cierre del modal con animación
  const handleClose = () => {
    setModalVisible(false);
    setTimeout(() => onClose(), 300); // Esperamos a que termine la animación
  };

  const handleEdit = () => {
    onEdit(item);
    setOpenSheet(false);
    handleClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      setOpenSheet(false);
      handleClose();
    }
  };
  
  // Función para abrir enlace externamente
  const openExternalLink = () => {
    // Sanitizar la URL antes de abrirla
    const safeUrl = sanitizeUrl(item.purchaseLink);
    if (!safeUrl) {
      console.warn('Se intentó abrir una URL no segura:', item.purchaseLink);
      setOpenSheet(false);
      return;
    }
    
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
    setOpenSheet(false);
  };

  // El bloqueo de scroll está manejado por el componente padre
  
  useEffect(() => {
    // Animación de entrada después del montaje
    setTimeout(() => setModalVisible(true), 10);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden"
      style={{ opacity: modalVisible ? 1 : 0 }}
    >
      <div 
        className="fixed inset-0 z-50 flex flex-col bg-[#121212] max-w-[500px] mx-auto overflow-hidden transform transition-transform duration-300 ease-out"
        style={{ transform: modalVisible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Botón flotante para volver */}
        <button 
          onClick={handleClose}
          className="fixed top-4 left-4 z-40 p-2 rounded-full flex items-center justify-center bg-[#1a1a1a]/80 hover:bg-[#252525] transition-colors shadow-lg backdrop-blur-sm"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        
        <div className="w-full h-full flex flex-col">
        
          <div className="flex-1 overflow-auto scrollable-content pb-36" style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}>
            {/* Imagen principal a sangre */}
            <div className="w-full bg-[#202020] relative">

              <div className="h-[280px] w-full">
                <ProductImage 
                  imageUrl={item.imageUrl} 
                  productId={productId}
                  title={item.title}
                  purchaseLink={item.purchaseLink}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Detalles del producto */}
            <div className="p-6">
              {/* Nombre del producto con mayor tamaño y peso */}
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                <Sheet 
                  open={openSheet} 
                  onOpenChange={setOpenSheet}
                >
                  <SheetTrigger asChild>
                    <button 
                      className="p-1 hover:bg-[#252525] rounded-full transition-colors ml-3 mt-1"
                      aria-label="Opciones"
                    >
                      <MoreVertical size={20} className="text-white/70" />
                    </button>
                  </SheetTrigger>
                  <ItemOptionsSheet
                    isOpen={openSheet}
                    onOpenChange={setOpenSheet}
                    item={item}
                    onEdit={(item) => {
                      onEdit(item);
                      setOpenSheet(false);
                      handleClose();
                    }}
                    onDelete={(item) => {
                      onDelete(item);
                      setOpenSheet(false);
                      handleClose();
                    }}
                    onMarkAsReceived={!item.isReceived && onMarkAsReceived ? (id) => {
                      setOpenSheet(false);
                      setShowReceivedConfirmation(true);
                    } : undefined}
                    onUnreserve={item.isReserved && !item.isReceived && onUnreserve ? (id) => {
                      onUnreserve(id);
                      setOpenSheet(false);
                      handleClose();
                    } : undefined}
                    onExternalLinkClick={(url) => {
                      // Sanitizar la URL antes de abrirla
                      const safeUrl = sanitizeUrl(url);
                      if (safeUrl) {
                        window.open(safeUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        console.warn('Se intentó abrir una URL no segura:', url);
                      }
                      setOpenSheet(false);
                    }}
                  />
                </Sheet>
              </div>
              
              {/* Precio como texto normal de mayor tamaño */}
              {item.price && (
                <div className="mb-2">
                  <span className="text-white text-xl font-medium">
                    {item.price}
                  </span>
                </div>
              )}
              
              {/* Fecha de adición con color secundario y mejor formato */}
              <div className="text-gray-400 text-sm mb-5">
                Añadido {formattedDate}
              </div>
              
              {/* Banner de recibido o reservado */}
              {item.isReceived && (
                <div className="bg-green-800/20 border border-green-800/30 rounded-xl p-4 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-green-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <CheckCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    {item.reserverName ? (
                      <p className="font-medium text-white text-sm"><span className="font-bold">{item.reserverName}</span> te lo regaló, ¡que lo disfrutes!</p>
                    ) : (
                      <p className="font-medium text-white text-sm">Has recibido este regalo, ¡que lo disfrutes!</p>
                    )}
                  </div>
                </div>
              )}
              {item.isReserved && !item.isReceived && (
                <div className="bg-[#5883C6]/20 border border-[#5883C6]/30 rounded-xl p-4 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-[#5883C6]/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-5 w-5 text-[#89AADC]" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Alguien ha reservado este regalo para ti, ¡pronto sabrás quién es!</p>
                  </div>
                </div>
              )}
              
              {/* Enlace externo - ahora antes de la descripción */}
              <div className="mb-6">
                <h3 className="block text-white text-sm mb-2">Enlace de compra</h3>
                {item.purchaseLink ? (
                  <SafeLink 
                    href={item.purchaseLink} 
                    className="flex items-center justify-between text-primary text-sm max-w-full"
                  >
                    <span className="truncate mr-2">{sanitizeInput(item.purchaseLink)}</span>
                    <ExternalLink size={16} className="flex-shrink-0" />
                  </SafeLink>
                ) : (
                  <p className="text-white/60 text-sm">No se añadió ningún enlace.</p>
                )}
              </div>
              
              {/* Descripción */}
              {item.description && (
                <div className="mb-6">
                  <h3 className="block text-white text-sm mb-2">Descripción</h3>
                  <SanitizedHTML 
                    html={item.description} 
                    className="text-white/80 text-sm"
                    tag="p"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Footer con botones fijos que respeta el área segura */}
          <div className="fixed bottom-0 left-0 right-0 max-w-[500px] mx-auto w-full flex justify-between bg-[#121212] p-4 border-t border-[#333] safe-area-bottom">
            <button
              onClick={handleDelete}
              className="px-6 py-3 border border-[#333] rounded-lg text-white font-medium hover:bg-[#252525] transition-colors flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </button>
            
            {item.isReserved && !item.isReceived && onMarkAsReceived ? (
              <button
                onClick={() => setShowReceivedConfirmation(true)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                <CheckCheck size={16} className="mr-2" />
                ¡Ya lo recibí!
              </button>
            ) : (
              <button
                onClick={handleEdit}
                disabled={item.isReserved || item.isReceived}
                className={`px-6 py-3 bg-primary hover:bg-primary/90 text-black rounded-lg font-medium transition-colors flex items-center ${item.isReserved || item.isReceived ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <Edit size={16} className="mr-2 text-black" style={{color: "black"}} />
                Editar
              </button>
            )}
            
            {/* Sheet de confirmación de recibido */}
            <ReceivedConfirmationSheet
              isOpen={showReceivedConfirmation}
              onClose={() => {
                setShowReceivedConfirmation(false);
                // Ya no cerramos el modal padre aquí, solo ocultamos el sheet de confirmación
              }}
              item={item}
              markAsReceivedMutation={markAsReceivedMutation}
              onItemReceived={() => handleClose()} // Cerrar el modal cuando el item se marca como recibido
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const WishDetailModal = (props: WishDetailModalProps) => {
  const { isOpen, item } = props;
  
  // Bloquear scroll cuando el modal está abierto
  useScrollLock(isOpen);
  
  // Cuando se abre el modal, forzamos un refresco de los datos
  // para asegurar que el estado mostrado sea el más reciente
  React.useEffect(() => {
    if (isOpen && item) {
      console.log('Abriendo modal de detalle - actualizando datos para mostrar estado más reciente');
      // Forzar refresco de todos los datos relevantes
      invalidateAllAppQueries(item.wishlistId);
    }
  }, [isOpen, item]);
  
  if (!isOpen || !item) return null;
  
  // Siempre usamos la vista móvil para mantener consistencia en todos los dispositivos
  return <MobileView {...props} item={item} />;
};

export default WishDetailModal;