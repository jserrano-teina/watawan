import React, { useEffect } from 'react';
import { WishItem } from '../../types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProductImage from '../ProductImage';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, ExternalLink, Calendar, X, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
}

const WishDetailModal: React.FC<WishDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete
}) => {
  const isMobile = useIsMobile();

  if (!item) return null;

  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { 
    addSuffix: true,
    locale: es
  });

  // Bloqueamos el scroll cuando está abierto en móvil
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

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
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      onClose();
    }
  };

  // Renderizado para móvil (fullscreen)
  if (isMobile) {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col">
        {/* Header con botón de regreso */}
        <div className="flex items-center p-4 border-b border-[#333]">
          <button 
            onClick={onClose}
            className="p-1 mr-2 text-white/80"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-medium">Detalle del producto</h1>
        </div>
        
        <div className="flex-1 overflow-auto">
          {/* Imagen principal */}
          <div className="h-72 w-full bg-[#202020] relative">
            <ProductImage 
              imageUrl={item.imageUrl} 
              productId={productId}
              title={item.title}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-contain"
            />
            
            {/* Badge de reservado */}
            {item.isReserved && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="bg-[#1e1e1e]/90 px-5 py-4 rounded-xl text-center border border-[#333] shadow-lg">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <i className="fas fa-check text-primary"></i>
                  </div>
                  <p className="font-medium text-white text-sm mb-1">¡Alguien ha reservado este regalo!</p>
                  <p className="text-white/70 text-xs">Será una sorpresa 🎁</p>
                </div>
              </div>
            )}
          </div>

          {/* Detalles del producto */}
          <div className="p-5">
            <h2 className="text-xl font-medium mb-2 text-white">{item.title}</h2>
            
            {item.price && (
              <div className="inline-block px-3 py-1 bg-primary/20 rounded-full text-primary font-medium text-sm mb-3">
                {item.price}
              </div>
            )}
            
            {/* Descripción */}
            {item.description && (
              <p className="text-white/80 text-sm mb-6">{item.description}</p>
            )}
            
            {/* Información adicional */}
            <div className="flex items-center text-xs text-white/60 mb-6">
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>Añadido {formattedDate}</span>
              </div>
            </div>
            
            {/* Enlace externo */}
            <a 
              href={item.purchaseLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center mb-6 text-primary text-sm"
            >
              <ExternalLink size={14} className="mr-2 flex-shrink-0" />
              <span className="truncate">{item.purchaseLink}</span>
            </a>
          </div>
        </div>
        
        {/* Footer con botones fijos */}
        <div className="p-4 border-t border-[#333] bg-[#121212] grid grid-cols-2 gap-3">
          <button
            onClick={handleDelete}
            className="flex items-center justify-center px-4 py-3 bg-[#202020] hover:bg-red-900/30 text-white rounded-lg text-sm transition-colors"
          >
            <Trash2 size={16} className="mr-2" />
            Eliminar
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center justify-center px-4 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm transition-colors"
          >
            <Edit size={16} className="mr-2" />
            Editar
          </button>
        </div>
      </div>
    );
  }

  // Renderizado para escritorio (dialog)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[#121212] text-white border-[#333]">
        <div className="relative">
          {/* Imagen principal */}
          <div className="h-60 w-full bg-[#202020] relative">
            <ProductImage 
              imageUrl={item.imageUrl} 
              productId={productId}
              title={item.title}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-contain"
            />
            
            {/* Badge de reservado */}
            {item.isReserved && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="bg-[#1e1e1e]/90 px-5 py-4 rounded-xl text-center border border-[#333] shadow-lg">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <i className="fas fa-check text-primary"></i>
                  </div>
                  <p className="font-medium text-white text-sm mb-1">¡Alguien ha reservado este regalo!</p>
                  <p className="text-white/70 text-xs">Será una sorpresa 🎁</p>
                </div>
              </div>
            )}
            
            {/* Botón de cerrar */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Detalles del producto */}
          <div className="p-5">
            <h2 className="text-xl font-medium mb-2 text-white">{item.title}</h2>
            
            {/* Descripción */}
            {item.description && (
              <p className="text-white/80 text-sm mb-4">{item.description}</p>
            )}
            
            {/* Información adicional */}
            <div className="flex items-center justify-between text-xs text-white/60 mb-5">
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>{formattedDate}</span>
              </div>
              
              {item.price && (
                <div className="px-3 py-1 bg-primary/20 rounded-full text-primary font-medium">
                  {item.price}
                </div>
              )}
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center px-4 py-2 bg-[#202020] hover:bg-[#303030] text-white rounded-lg text-sm transition-colors"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center px-4 py-2 bg-[#202020] hover:bg-red-900/30 text-white rounded-lg text-sm transition-colors"
                >
                  <Trash2 size={16} className="mr-2" />
                  Eliminar
                </button>
              </div>
              
              <a 
                href={item.purchaseLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm transition-colors"
              >
                <ExternalLink size={16} className="mr-2" />
                Ver producto
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WishDetailModal;