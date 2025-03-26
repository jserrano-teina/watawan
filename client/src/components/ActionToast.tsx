import React, { useEffect, useState } from 'react';
import { Edit, Trash, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WishItem } from '../types';

interface ActionToastProps {
  item: WishItem;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  onClose: () => void;
  show: boolean;
}

const ActionToast: React.FC<ActionToastProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  onClose,
  show 
}) => {
  const [animation, setAnimation] = useState<'enter' | 'exit' | null>(null);
  
  useEffect(() => {
    if (show) {
      setAnimation('enter');
    } else if (animation === 'enter') {
      setAnimation('exit');
      
      // Cerrar después de completar la animación de salida
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose, animation]);
  
  // Función para abrir enlace
  const openExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    onClose();
  };
  
  // Funciones para editar y eliminar
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
    onClose();
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
    }
    onClose();
  };
  
  if (!show && animation !== 'exit') return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
      <div
        className={cn(
          "w-full max-w-md px-4 pt-2 pb-3 rounded-b-xl shadow-lg bg-[#252525] border border-[#333] transition-all duration-300 flex flex-col",
          animation === 'enter' 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-full opacity-0',
          animation && "pointer-events-auto"
        )}
      >
        {/* Encabezado con título y botón de cierre */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-medium text-sm">Opciones para: {item.title}</h3>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Acciones */}
        <div className="flex justify-between mt-2">
          <button 
            onClick={handleEdit}
            className={cn(
              "flex items-center justify-center text-sm rounded-lg px-4 py-2 text-white/90 hover:text-white bg-[#333] hover:bg-[#404040] transition-colors flex-1 mr-2",
              item.isReserved ? 'opacity-50 pointer-events-none' : ''
            )}
          >
            <Edit size={16} className="mr-1.5" />
            Editar
          </button>
          
          <button 
            onClick={openExternalLink}
            className="flex items-center justify-center text-sm rounded-lg px-4 py-2 text-white/90 hover:text-white bg-[#333] hover:bg-[#404040] transition-colors flex-1 mr-2"
          >
            <ExternalLink size={16} className="mr-1.5" />
            Ver producto
          </button>
          
          <button 
            onClick={handleDelete}
            className="flex items-center justify-center text-sm rounded-lg px-4 py-2 text-red-400 hover:text-red-300 bg-[#333] hover:bg-[#404040] transition-colors flex-1"
          >
            <Trash size={16} className="mr-1.5" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionToast;