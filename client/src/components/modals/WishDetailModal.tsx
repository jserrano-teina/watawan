import React, { useEffect, useState } from 'react';
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

const DesktopView = ({ 
  item, 
  onClose, 
  onEdit, 
  onDelete,
  isOpen 
}: { 
  item: WishItem;
  onClose: () => void;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  isOpen: boolean;
}) => {
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
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
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
                className="w-full h-full object-contain"
              />
              
              {/* Badge de reservado */}
              {item.isReserved && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <div className="bg-[#121212]/90 px-5 py-4 rounded-xl text-center border border-[#333] shadow-lg">
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
              <h2 className="text-xl font-medium mb-3 text-white">{item.title}</h2>
              
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
                  <h3 className="block text-white font-medium mb-2">Descripción</h3>
                  <p className="text-white/80 text-sm">{item.description}</p>
                </div>
              )}
              
              {/* Enlace externo */}
              <div className="mb-6">
                <h3 className="block text-white font-medium mb-2">Enlace de compra</h3>
                <a 
                  href={item.purchaseLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary text-sm max-w-full"
                >
                  <ExternalLink size={14} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{item.purchaseLink}</span>
                </a>
              </div>
              
              {/* Información adicional */}
              <div className="flex items-center text-xs text-white/60 mb-3">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  <span>Añadido {formattedDate}</span>
                </div>
              </div>
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
                Ver producto
              </a>
              <button
                onClick={handleEdit}
                disabled={item.isReserved}
                className={`px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center ${item.isReserved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <Edit size={16} className="mr-2" />
                Editar
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MobileView = ({ 
  item, 
  onClose, 
  onEdit, 
  onDelete 
}: {
  item: WishItem;
  onClose: () => void;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
}) => {
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
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
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
    <div className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col">
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
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Badge de reservado (superpuesto) */}
          {item.isReserved && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="bg-[#121212]/90 px-5 py-4 rounded-xl text-center border border-[#333] shadow-lg">
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
        <div className="p-6">
          {/* Nombre del producto con mayor tamaño y peso */}
          <h2 className="text-2xl font-semibold mb-3 text-white">{item.title}</h2>
          
          {/* Precio como texto normal de mayor tamaño */}
          {item.price && (
            <div className="mb-2">
              <span className="text-white text-xl font-medium">
                {item.price}
              </span>
            </div>
          )}
          
          {/* Fecha de adición con color secundario y mejor formato */}
          <div className="text-gray-400 text-sm mb-6">
            Añadido {formattedDate}
          </div>
          
          {/* Enlace externo - ahora antes de la descripción */}
          <div className="mb-6">
            <h3 className="block text-white font-medium mb-2">Enlace de compra</h3>
            <a 
              href={item.purchaseLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-primary text-sm max-w-full"
            >
              <ExternalLink size={14} className="mr-2 flex-shrink-0" />
              <span className="truncate">{item.purchaseLink}</span>
            </a>
          </div>
          
          {/* Descripción */}
          {item.description && (
            <div className="mb-6">
              <h3 className="block text-white font-medium mb-2">Descripción</h3>
              <p className="text-white/80 text-sm">{item.description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer con botones fijos */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-between bg-[#121212] p-4 border-t border-[#333]">
        <button
          onClick={handleDelete}
          className="px-6 py-3 border border-[#333] rounded-lg text-white font-medium hover:bg-[#252525] transition-colors flex items-center"
        >
          <Trash2 size={16} className="mr-2" />
          Eliminar
        </button>
        <button
          onClick={handleEdit}
          disabled={item.isReserved}
          className={`px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center ${item.isReserved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          <Edit size={16} className="mr-2" />
          Editar
        </button>
      </div>
    </div>
  );
};

const WishDetailModal: React.FC<WishDetailModalProps> = (props) => {
  const { isOpen, item } = props;
  const isMobile = useIsMobile();
  
  if (!isOpen || !item) return null;
  
  return isMobile ? <MobileView {...props} item={item} /> : <DesktopView {...props} item={item} />;
}

export default WishDetailModal;