import React, { useEffect, useState } from 'react';
import { WishItem } from '../../types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ProductImage from '../ProductImage';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, ExternalLink, Calendar, X, ArrowLeft, Check, MoreVertical, Undo } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { ItemOptionsSheet } from './ItemOptionsSheet';
import { ReceivedConfirmationSheet } from './ReceivedConfirmationSheet';
import { UnreserveConfirmationSheet } from './UnreserveConfirmationSheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface WishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  onMarkAsReceived?: (itemId: number) => void;
  onUnreserve?: (itemId: number) => void;
}

const DesktopView = ({ 
  item, 
  onClose, 
  onEdit, 
  onDelete,
  isOpen,
  onMarkAsReceived,
  onUnreserve
}: { 
  item: WishItem;
  onClose: () => void;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  isOpen: boolean;
  onMarkAsReceived?: (itemId: number) => void;
  onUnreserve?: (itemId: number) => void;
}) => {
  const [openSheet, setOpenSheet] = useState(false);
  const [showReceivedConfirmation, setShowReceivedConfirmation] = useState(false);
  const [showUnreserveConfirmation, setShowUnreserveConfirmation] = useState(false);
  const queryClient = useQueryClient();
  
  // Mutation para marcar como recibido
  const markAsReceivedMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/wishlist/items/${itemId}/received`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Error al marcar como recibido');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wishlist/${item.wishlistId}/items`] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
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

  const handleEdit = () => {
    onEdit(item);
    setOpenSheet(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      setOpenSheet(false);
      onClose();
    }
  };
  
  // Función para abrir enlace externamente
  const openExternalLink = () => {
    window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    setOpenSheet(false);
  };

  // Función para manejar el desmarcar como reservado
  const handleUnreserve = () => {
    setOpenSheet(false);
    setShowUnreserveConfirmation(true);
  };

  // Función para confirmar el desmarcar como reservado
  const handleConfirmUnreserve = () => {
    if (onUnreserve) {
      onUnreserve(item.id);
      setShowUnreserveConfirmation(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[#121212] text-white border-[#333]">
        <div className="relative">
          {/* Header con título */}
          <div className="flex items-center justify-between p-4 border-b border-[#333]">
            <h1 className="text-lg font-medium">Detalle del producto</h1>
            <button 
              onClick={onClose}
              className="p-2 rounded-full text-white/80 hover:bg-[#252525] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Contenido con scroll */}
          <div className="max-h-[calc(80vh-150px)] overflow-y-auto">
            {/* Imagen principal */}
            <div className="h-60 w-full bg-[#202020] relative">
              <ProductImage 
                imageUrl={item.imageUrl} 
                productId={productId}
                title={item.title}
                purchaseLink={item.purchaseLink}
                className="w-full h-full object-cover"
              />
              
              {/* Eliminamos la superposición */}
            </div>

            {/* Detalles del producto */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                <Sheet 
                  open={openSheet} 
                  onOpenChange={setOpenSheet}
                >
                  <SheetTrigger asChild>
                    <button 
                      className="p-1 hover:bg-[#252525] rounded-full transition-colors"
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
                      onClose();
                    }}
                    onDelete={(item) => {
                      onDelete(item);
                      setOpenSheet(false);
                      onClose();
                    }}
                    onMarkAsReceived={!item.isReceived && onMarkAsReceived ? (id) => {
                      setOpenSheet(false);
                      setShowReceivedConfirmation(true);
                    } : undefined}
                    onUnreserve={item.isReserved && !item.isReceived && onUnreserve ? (id) => {
                      setOpenSheet(false);
                      setShowUnreserveConfirmation(true);
                    } : undefined}
                    onExternalLinkClick={(url) => {
                      window.open(url, '_blank', 'noopener,noreferrer');
                      setOpenSheet(false);
                    }}
                  />
                </Sheet>
              </div>
              
              {item.price && (
                <div className="flex items-center mb-4">
                  <div className="inline-block px-3 py-1 bg-primary/20 rounded-lg text-primary font-medium text-sm">
                    {item.price}
                  </div>
                </div>
              )}
              
              {/* Descripción */}
              {item.description && (
                <div className="mb-6">
                  <h3 className="block text-white text-sm mb-2">Descripción</h3>
                  <p className="text-white/80 text-sm">{item.description}</p>
                </div>
              )}
              
              {/* Enlace externo */}
              <div className="mb-6">
                <h3 className="block text-white text-sm mb-2">Enlace de compra</h3>
                <a 
                  href={item.purchaseLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-primary text-sm max-w-full"
                >
                  <span className="truncate mr-2">{item.purchaseLink}</span>
                  <ExternalLink size={16} className="flex-shrink-0" />
                </a>
              </div>
              
              {/* Información adicional */}
              <div className="flex items-center text-xs text-white/60 mb-3">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  <span>Añadido {formattedDate}</span>
                </div>
              </div>
              
              {/* Banner de recibido o reservado */}
              {item.isReceived && (
                <div className="bg-purple-800/20 border border-purple-800/30 rounded-xl p-4 mb-4 flex items-center">
                  <div className="w-9 h-9 bg-purple-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-4 w-4 text-purple-400" />
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
                <div className="bg-green-800/20 border border-green-800/30 rounded-xl p-4 mb-4 flex items-center">
                  <div className="w-9 h-9 bg-green-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Alguien ha reservado este regalo para ti, ¡pronto sabrás quién es!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer con botones */}
          <div className="flex justify-between p-4 border-t border-[#333] bg-[#121212]">
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-[#333] rounded-lg text-white text-sm font-medium hover:bg-[#252525] transition-colors flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </button>
            <div className="flex gap-2">
              <a 
                href={item.purchaseLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 border border-[#333] rounded-lg text-white text-sm font-medium hover:bg-[#252525] transition-colors flex items-center"
              >
                <ExternalLink size={16} className="mr-2" />
                Ir al enlace de compra
              </a>
              {item.isReserved && !item.isReceived ? (
                <button
                  onClick={() => setShowReceivedConfirmation(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <Check size={16} className="mr-2" />
                  ¡Ya lo recibí!
                </button>
              ) : (
                <button
                  onClick={handleEdit}
                  disabled={item.isReserved || item.isReceived}
                  className={`px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center ${item.isReserved || item.isReceived ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </button>
              )}
            </div>
          </div>
          
          {/* Sheet de confirmación de recibido */}
          <ReceivedConfirmationSheet
            isOpen={showReceivedConfirmation}
            onClose={() => {
              setShowReceivedConfirmation(false);
              // Ya no cerramos el modal padre aquí, solo ocultamos el sheet de confirmación
            }}
            item={item}
            markAsReceivedMutation={markAsReceivedMutation}
            onItemReceived={() => onClose()} // Cerrar el modal cuando el item se marca como recibido
          />
          
          {/* Sheet de confirmación para desmarcar como reservado */}
          <UnreserveConfirmationSheet
            isOpen={showUnreserveConfirmation}
            onClose={() => setShowUnreserveConfirmation(false)}
            onConfirm={handleConfirmUnreserve}
            item={item}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
  const [showUnreserveConfirmation, setShowUnreserveConfirmation] = useState(false);
  const queryClient = useQueryClient();
  
  // Mutation para marcar como recibido
  const markAsReceivedMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/wishlist/items/${itemId}/received`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Error al marcar como recibido');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wishlist/${item.wishlistId}/items`] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
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

  const handleEdit = () => {
    onEdit(item);
    setOpenSheet(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      setOpenSheet(false);
      onClose();
    }
  };
  
  // Función para abrir enlace externamente
  const openExternalLink = () => {
    window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    setOpenSheet(false);
  };
  
  // Función para manejar el desmarcar como reservado
  const handleUnreserve = () => {
    setOpenSheet(false);
    setShowUnreserveConfirmation(true);
  };

  // Función para confirmar el desmarcar como reservado
  const handleConfirmUnreserve = () => {
    if (onUnreserve) {
      onUnreserve(item.id);
      setShowUnreserveConfirmation(false);
      onClose();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col animate-slide-up">
      <div className="flex-1 overflow-auto pb-28">
        {/* Imagen principal a sangre */}
        <div className="w-full bg-[#202020] relative">
          {/* Botón de regreso flotante, ahora fixed para mantenerlo visible al hacer scroll */}
          <button 
            onClick={onClose}
            className="fixed top-4 left-4 z-30 bg-[#252525]/80 p-2 rounded-full text-white/90 hover:bg-[#333] transition-colors shadow-lg backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="h-80 w-full">
            <ProductImage 
              imageUrl={item.imageUrl} 
              productId={productId}
              title={item.title}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Eliminamos la superposición */}
        </div>

        {/* Detalles del producto */}
        <div className="p-6">
          {/* Nombre del producto con mayor tamaño y peso */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
            <Sheet 
              open={openSheet} 
              onOpenChange={setOpenSheet}
            >
              <SheetTrigger asChild>
                <button 
                  className="p-1 hover:bg-[#252525] rounded-full transition-colors"
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
                  onClose();
                }}
                onDelete={(item) => {
                  onDelete(item);
                  setOpenSheet(false);
                  onClose();
                }}
                onMarkAsReceived={!item.isReceived && onMarkAsReceived ? (id) => {
                  setOpenSheet(false);
                  setShowReceivedConfirmation(true);
                } : undefined}
                onUnreserve={item.isReserved && !item.isReceived && onUnreserve ? (id) => {
                  setOpenSheet(false);
                  setShowUnreserveConfirmation(true);
                } : undefined}
                onExternalLinkClick={(url) => {
                  window.open(url, '_blank', 'noopener,noreferrer');
                  setOpenSheet(false);
                }}
              />
            </Sheet>
          </div>
          
          {item.price && (
            <div className="flex items-center mb-4">
              <div className="inline-block px-3 py-1 bg-primary/20 rounded-lg text-primary font-medium text-sm">
                {item.price}
              </div>
            </div>
          )}
          
          {/* Descripción */}
          {item.description && (
            <div className="mb-6">
              <h3 className="block text-white text-sm mb-2">Descripción</h3>
              <p className="text-white/80 text-sm">{item.description}</p>
            </div>
          )}
          
          {/* Enlace externo */}
          <div className="mb-6">
            <h3 className="block text-white text-sm mb-2">Enlace de compra</h3>
            <a 
              href={item.purchaseLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between text-primary text-sm max-w-full"
            >
              <span className="truncate mr-2">{item.purchaseLink}</span>
              <ExternalLink size={16} className="flex-shrink-0" />
            </a>
          </div>
          
          {/* Información adicional */}
          <div className="flex items-center text-xs text-white/60 mb-3">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <span>Añadido {formattedDate}</span>
            </div>
          </div>
          
          {/* Banner de recibido o reservado */}
          {item.isReceived && (
            <div className="bg-purple-800/20 border border-purple-800/30 rounded-xl p-4 mb-4 flex items-center">
              <div className="w-9 h-9 bg-purple-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Check className="h-4 w-4 text-purple-400" />
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
            <div className="bg-green-800/20 border border-green-800/30 rounded-xl p-4 mb-4 flex items-center">
              <div className="w-9 h-9 bg-green-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Check className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">Alguien ha reservado este regalo para ti, ¡pronto sabrás quién es!</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Botones flotantes en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-between items-center p-4 bg-[#121212] border-t border-[#333] z-10">
        <button
          onClick={handleDelete}
          className="w-12 h-12 flex flex-col items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <Trash2 size={20} />
          <span className="text-xs mt-1">Eliminar</span>
        </button>
        
        <a 
          href={item.purchaseLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 flex flex-col items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ExternalLink size={20} />
          <span className="text-xs mt-1">Comprar</span>
        </a>
        
        {item.isReserved && !item.isReceived ? (
          <button
            onClick={() => setShowReceivedConfirmation(true)}
            className="w-12 h-12 flex flex-col items-center justify-center text-green-400 hover:text-green-300 transition-colors"
          >
            <Check size={20} />
            <span className="text-xs mt-1">Recibido</span>
          </button>
        ) : (
          <button
            onClick={handleEdit}
            disabled={item.isReserved || item.isReceived}
            className={`w-12 h-12 flex flex-col items-center justify-center transition-colors ${item.isReserved || item.isReceived ? 'text-white/30 pointer-events-none' : 'text-primary hover:text-primary/80'}`}
          >
            <Edit size={20} />
            <span className="text-xs mt-1">Editar</span>
          </button>
        )}
      </div>
      
      {/* Sheet de confirmación de recibido */}
      <ReceivedConfirmationSheet
        isOpen={showReceivedConfirmation}
        onClose={() => {
          setShowReceivedConfirmation(false);
          // Ya no cerramos el modal padre aquí, solo ocultamos el sheet de confirmación
        }}
        item={item}
        markAsReceivedMutation={markAsReceivedMutation}
        onItemReceived={() => onClose()} // Cerrar el modal cuando el item se marca como recibido
      />
      
      {/* Sheet de confirmación para desmarcar como reservado */}
      <UnreserveConfirmationSheet
        isOpen={showUnreserveConfirmation}
        onClose={() => setShowUnreserveConfirmation(false)}
        onConfirm={handleConfirmUnreserve}
        item={item}
      />
    </div>
  );
};

const WishDetailModal = (props: WishDetailModalProps) => {
  const isMobile = useIsMobile();
  const { item } = props;
  
  if (!item) return null;

  return isMobile 
    ? <MobileView {...props} item={item} /> 
    : <DesktopView {...props} item={item} />;
};

export default WishDetailModal;