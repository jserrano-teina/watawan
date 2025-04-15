import React, { useState, useEffect } from 'react';
import { WishItem } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, ArrowLeft, Check, CheckCheck, Lock as LockIcon } from 'lucide-react';
import ProductImage from '../ProductImage';
import { Button } from '@/components/ui/button';
import { SafeLink } from '@/components/ui/SafeLink';
import { SanitizedHTML } from '@/components/ui/SanitizedHTML';
import { sanitizeInput } from '@/lib/sanitize';

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
        className="fixed inset-0 z-50 flex flex-col bg-[#121212] overflow-hidden transform transition-transform duration-300 ease-out max-w-[500px] mx-auto"
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
          <div className="w-full h-80 bg-[#252525] relative">
            <ProductImage 
              imageUrl={item.imageUrl} 
              title={item.title}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Información del producto */}
          <div className="px-5 py-6">
            <h2 className="text-2xl font-semibold text-white mb-2.5 leading-tight">{item.title}</h2>
            
            {item.price && (
              <div className="mb-1">
                <span className="text-xl font-semibold text-white">{item.price}</span>
              </div>
            )}
            
            <div className="mb-4">
              <span className="text-sm text-white/60">Añadido {timeAgo}</span>
            </div>
            
            {/* Banner de recibido o reservado */}
            {item.isReceived && (
              <div className="bg-green-800/20 border border-green-800/30 rounded-xl p-4 mb-6 flex items-center">
                <div className="w-10 h-10 bg-green-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <CheckCheck className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  {item.reserverName ? (
                    <p className="font-medium text-white text-sm">
                      <span className="font-bold">{sanitizeInput(item.reserverName)}</span> ya regaló este artículo
                    </p>
                  ) : (
                    <p className="font-medium text-white text-sm">Este regalo ya ha sido recibido</p>
                  )}
                </div>
              </div>
            )}
            {item.isReserved && !item.isReceived && (
              <div className="bg-[#5883C6]/20 border border-[#5883C6]/30 rounded-xl p-4 mb-6 flex items-center">
                <div className="w-10 h-10 bg-[#5883C6]/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <LockIcon className="h-5 w-5 text-[#89AADC]" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Alguien ya ha reservado este regalo y no está disponible</p>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 text-white">Enlace de compra</h3>
              {item.purchaseLink ? (
                <SafeLink 
                  href={item.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm flex items-center justify-between truncate hover:underline"
                >
                  <span className="truncate">{item.purchaseLink}</span>
                  <ExternalLink size={16} className="flex-shrink-0 ml-2" />
                </SafeLink>
              ) : (
                <p className="text-white/60 text-sm">No se añadió ningún enlace.</p>
              )}
            </div>
            
            {item.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-white">Descripción</h3>
                <SanitizedHTML 
                  html={item.description} 
                  className="text-sm text-white/80 whitespace-pre-line" 
                  tag="p"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Barra inferior fija con botones - Solo visible si el item no está reservado */}
        {!item.isReserved && (
          <div className="border-t border-[#333] p-4 flex justify-end">
            <Button 
              onClick={onReserveClick}
              className="h-[50px] px-10 bg-primary hover:bg-primary/90 text-black"
            >
              Lo regalaré yo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsModal;