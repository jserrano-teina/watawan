import React from 'react';
import { WishItem } from '../../types';
import { ExternalLink, X } from 'lucide-react';
import ProductImage from '../ProductImage';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";

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
  // Si no hay item, no renderizamos nada
  if (!item) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full h-full p-0 sm:max-w-xl border-none bg-[#121212]">
        <SheetHeader className="sr-only">
          <SheetTitle>Detalles del regalo</SheetTitle>
          <SheetDescription>Información detallada sobre este regalo</SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {/* Cabecera con botón de cierre */}
          <div className="absolute top-4 right-4 z-30">
            <button 
              onClick={onClose}
              className="text-white opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
          
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
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-3 leading-tight">{item.title}</h2>
              
              {item.price && (
                <div className="mb-5">
                  <span className="text-xl font-semibold text-white">{item.price}</span>
                </div>
              )}
              
              {item.isReserved && (
                <div className="mb-4">
                  <span className="px-2.5 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full inline-block">
                    Reservado
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="font-medium mb-1.5 text-white">Enlace de compra</h3>
                <a 
                  href={item.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm flex items-center"
                >
                  <ExternalLink size={14} className="flex-shrink-0 mr-1.5" />
                  <span className="truncate">{item.purchaseLink}</span>
                </a>
              </div>
              
              {item.description && (
                <div className="mb-5">
                  <h3 className="font-medium mb-1.5 text-white">Descripción</h3>
                  <p className="text-sm text-white/80">{item.description}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Barra inferior fija con botones - solo si el item no está reservado */}
          {!item.isReserved && (
            <div className="border-t border-[#333] p-4 grid grid-cols-2 gap-3">
              <a 
                href={item.purchaseLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-[50px] px-4 rounded-lg border border-[#444] bg-transparent text-white hover:bg-[#2a2a2a] transition-colors"
              >
                <ExternalLink size={16} className="mr-2" />
                Enlace de compra
              </a>
              <button 
                onClick={onReserveClick}
                className="inline-flex items-center justify-center h-[50px] px-4 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Lo regalaré yo
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DetailsModal;