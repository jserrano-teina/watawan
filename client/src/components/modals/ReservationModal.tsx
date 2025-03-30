import React, { useState, useEffect } from 'react';
import { WishItem } from '../../types';
import { Button } from "@/components/ui/button";
import { Gift } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reserverName: string) => void;
  item?: WishItem;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  item
}) => {
  const [reserverName, setReserverName] = useState('');
  
  if (!item || !isOpen) return null;

  // Bloquear el scroll del body cuando se muestra el modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(reserverName);
    setReserverName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1a1a1a] text-white border border-[#333] rounded-lg w-full max-w-md mx-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-semibold">Confirmar reserva</h2>
        </div>
        
        <div className="py-2">
          <p className="text-white/80 mb-5">¿Estás seguro que quieres reservar este regalo? Una vez confirmado, nadie más podrá reservarlo.</p>
          
          <div className="p-3 bg-[#252525] rounded-lg mb-5">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[#333] rounded overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <Gift className="h-6 w-6 text-white/60" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-white">{item.title}</h3>
                {item.description && (
                  <p className="text-white/60 text-sm">{item.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-5">
            <label htmlFor="reserverName" className="block text-white/90 font-medium mb-1">Tu nombre (opcional)</label>
            <input 
              type="text" 
              id="reserverName" 
              className="w-full h-[50px] px-3 py-2 border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-[#121212] text-white" 
              placeholder="¿Cómo quieres que te conozcan?"
              value={reserverName}
              onChange={(e) => setReserverName(e.target.value)}
            />
            <p className="text-white/50 text-xs mt-1">Esto es solo para ti, no se mostrará a la persona que recibirá el regalo</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#444] text-white hover:bg-[#2a2a2a] hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Confirmar reserva
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
