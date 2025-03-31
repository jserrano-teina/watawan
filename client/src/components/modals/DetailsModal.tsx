import React, { useState, useEffect } from 'react';
import { WishItem } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import ProductImage from '../ProductImage';
import { Button } from '@/components/ui/button';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  onReserveClick: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  onReserveClick 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Animación de entrada y control de scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Pequeño delay para la animación de entrada
      setTimeout(() => {
        setModalVisible(true);
      }, 10);
    } else {
      setModalVisible(false);
      // Retraso para permitir que la animación se complete
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 300);
    }
  }, [isOpen]);
  
  // Si no hay item o no está abierto, no renderizar nada
  if (!item || !isOpen) return null;
  
  // Formatear la fecha de creación para mostrarla
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: es
  });

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden"
      style={{ opacity: modalVisible ? 1 : 0 }}
    >
      <div 
        className="fixed inset-0 z-50 flex flex-col bg-[#121212] overflow-hidden transform transition-transform duration-300 ease-out"
        style={{ transform: modalVisible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Botón flotante para volver */}
        <button 
          onClick={onClose}
          className="fixed top-4 left-4 z-30 p-2 rounded-full flex items-center justify-center bg-[#1a1a1a]/80 hover:bg-[#252525] transition-colors shadow-lg backdrop-blur-sm"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        
        {/* Contenido scrolleable */}
        <div className="flex-grow overflow-auto">
          {/* Imagen a sangre al inicio */}
          <div className="w-full h-72 bg-[#252525] relative">
            <ProductImage 
              imageUrl={item.imageUrl} 
              title={item.title}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Información del producto */}
          <div className="px-5 py-6">
            <h2 className="text-2xl font-bold text-white mb-2.5 leading-tight">{item.title}</h2>
            
            {item.price && (
              <div className="mb-5">
                <span className="text-xl font-bold text-white">{item.price}</span>
              </div>
            )}
            
            <div className="my-4">
              <span className="text-sm text-white/60">Añadido a la lista {timeAgo}</span>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-white">Enlace de compra</h3>
              <a 
                href={item.purchaseLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm flex items-center truncate hover:underline"
              >
                <ExternalLink size={14} className="flex-shrink-0 mr-1.5" />
                <span className="truncate">{item.purchaseLink}</span>
              </a>
            </div>
            
            {item.description && (
              <div className="mb-6">
                <h3 className="font-medium mb-2 text-white">Descripción</h3>
                <p className="text-sm text-white/80 whitespace-pre-line">{item.description}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Barra inferior fija con botones */}
        <div className="border-t border-[#333] p-4 grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            asChild
            className="h-[50px] border-[#444] text-white hover:bg-[#2a2a2a] hover:text-white"
          >
            <a 
              href={item.purchaseLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
            >
              <ExternalLink size={16} className="mr-2" />
              Enlace de compra
            </a>
          </Button>
          <Button 
            onClick={onReserveClick}
            className="h-[50px] bg-primary hover:bg-primary/90 text-white"
          >
            Lo regalaré yo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;