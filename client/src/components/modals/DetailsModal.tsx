import React from 'react';
import { WishItem } from '../../types';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink, ArrowLeft } from 'lucide-react';
import ProductImage from '../ProductImage';

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
  if (!item) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 z-50 bg-[#121212] overflow-hidden flex flex-col p-0 border-none shadow-none max-w-full h-full sm:h-full rounded-none">
        {/* Botón flotante para volver */}
        <button 
          onClick={() => onClose()}
          className="fixed top-4 left-4 z-30 p-2 rounded-full flex items-center justify-center bg-[#252525] hover:bg-[#333] transition-colors shadow-lg backdrop-blur-sm"
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
          <div className="p-5">
            <h2 className="text-2xl font-semibold text-white mb-2.5 leading-tight">{item.title}</h2>
            
            {item.price && (
              <div className="mb-5">
                <span className="text-xl font-semibold text-white">{item.price}</span>
              </div>
            )}
            
            <div className="my-4 flex text-sm text-white/60">
              <span>Añadido a la lista</span>
            </div>
            
            <div className="mb-5">
              <h3 className="font-medium mb-1.5 text-white">Enlace de compra</h3>
              <a 
                href={item.purchaseLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm flex items-center truncate"
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
        
        {/* Barra inferior fija con botones */}
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
      </DialogContent>
    </Dialog>
  );
};

export default DetailsModal;