import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { WishItem } from '../../types';
import { sanitizeInput, sanitizeUrl } from '@/lib/sanitize';
import { SafeLink } from '@/components/ui/SafeLink';
import { SanitizedHTML } from '@/components/ui/SanitizedHTML';
import ProductImage from '../ProductImage';

interface DetailsModalProps {
  item: WishItem;
  onClose: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-lg w-full max-w-[500px] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium">Detalles del regalo</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-auto flex-grow p-4">
          {/* Imagen del producto */}
          <div className="w-full h-48 mb-4 bg-gray-900 rounded-lg overflow-hidden">
            <ProductImage 
              imageUrl={item.imageUrl}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-contain"
              alt={sanitizeInput(item.title)}
            />
          </div>

          {/* Información del producto */}
          <h3 className="text-xl font-medium mb-2">
            {sanitizeInput(item.title)}
          </h3>
          
          {item.price && (
            <p className="text-primary text-lg font-medium mb-3">{item.price}</p>
          )}
          
          {item.description && (
            <div className="mt-4 mb-6 text-gray-300">
              <SanitizedHTML html={item.description} />
            </div>
          )}
          
          {/* Botón para compra */}
          <div className="mt-auto pt-4">
            <SafeLink
              href={sanitizeUrl(item.purchaseLink)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-black font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={20} />
              <span>Ver en tienda</span>
            </SafeLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;