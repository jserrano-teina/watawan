import React, { useState } from 'react';
import { WishItem } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  
  if (!item) return null;

  const handleConfirm = () => {
    onConfirm(reserverName);
    setReserverName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] text-white border border-[#333] sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Confirmar reserva</DialogTitle>
        </DialogHeader>
        
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
        
        <DialogFooter className="gap-3 mt-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;
