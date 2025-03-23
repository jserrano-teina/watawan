import React from 'react';
import { WishItem } from '../../types';
import ProductImage from '../ProductImage';
import { ArrowLeft, Edit, Share2, Trash2, ExternalLink } from 'lucide-react';

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
  if (!isOpen || !item) return null;

  const handleEdit = () => {
    onEdit(item);
    onClose();
  };

  const handleDelete = () => {
    onDelete(item);
    onClose();
  };

  const openPurchaseLink = () => {
    window.open(item.purchaseLink, '_blank');
  };

  // Formatear la fecha
  const formattedDate = new Date(item.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] min-h-screen overflow-auto">
      <div className="flex flex-col h-full text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-[#333] bg-[#121212]">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#252525] rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-[#252525] rounded-full transition-colors">
              <Share2 size={20} />
            </button>
            <button 
              onClick={handleEdit}
              className="p-2 hover:bg-[#252525] rounded-full transition-colors"
            >
              <Edit size={20} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 hover:bg-[#252525] rounded-full transition-colors text-red-500"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
        
        {/* Contenido */}
        <div className="flex-1 p-4">
          {/* Imagen */}
          <div className="aspect-w-16 aspect-h-9 mb-6">
            <ProductImage 
              imageUrl={item.imageUrl} 
              title={item.title} 
              purchaseLink={item.purchaseLink}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
          
          {/* Título y descripción */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
            <p className="text-sm text-gray-400 mb-4">Añadido el {formattedDate}</p>
            
            {item.description && (
              <div className="mt-4 text-gray-300 whitespace-pre-line">
                {item.description}
              </div>
            )}
          </div>
          
          {/* Enlace de compra */}
          <div className="bg-[#252525] rounded-lg p-4 mb-6 border border-[#333]">
            <h3 className="text-lg font-medium mb-2">Enlace de compra</h3>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 truncate flex-1 mr-2">
                {item.purchaseLink}
              </p>
              <button 
                onClick={openPurchaseLink}
                className="p-2 bg-primary/20 text-primary rounded-full flex-shrink-0"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishDetailModal;