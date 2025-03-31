import React, { useState } from 'react';
import { WishItem } from '../../types';
import { Button } from "@/components/ui/button";
import { Gift, X } from 'lucide-react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";

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

  const handleConfirm = () => {
    onConfirm(reserverName);
    setReserverName('');
    onClose();
  };
  
  // Si no hay item, no renderizamos nada
  if (!item) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Confirmar reserva</SheetTitle>
          <SheetDescription>Reserva un regalo de la lista de deseos</SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">Confirmar reserva</h3>
          <button 
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="px-6 mt-4">
          <p className="text-white/80 mb-6">¿Estás seguro que quieres reservar este regalo? Una vez confirmado, nadie más podrá reservarlo.</p>
          
          <div className="p-3 bg-[#252525] rounded-lg mb-6">
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
                  <p className="text-white/60 text-sm line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="reserverName" className="block text-white/90 font-medium mb-2">Tu nombre (opcional)</label>
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
          
          <div className="flex gap-3 pt-2">
            <SheetClose asChild>
              <Button 
                variant="outline" 
                className="flex-1 border-[#444] text-white hover:bg-[#2a2a2a] hover:text-white h-[50px]"
              >
                Cancelar
              </Button>
            </SheetClose>
            <Button 
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-[50px]"
            >
              Confirmar reserva
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReservationModal;
