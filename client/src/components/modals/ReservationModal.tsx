import React, { useState } from 'react';
import { WishItem } from '../../types';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
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
    // Ya no llamamos a onClose() aquí porque el componente padre
    // se encargará de cerrar este modal manteniendo abierto el de detalles
  };
  
  // Si no hay item, no renderizamos nada
  if (!item) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0 z-[60]"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Reservar regalo</SheetTitle>
          <SheetDescription>Reserva un regalo de la lista de deseos</SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-start justify-between">
          <h3 className="text-white text-xl font-medium">{item.title}</h3>
          <button 
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1 ml-3 mt-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="px-6 mt-4">
          <p className="text-white/80 mb-6">¿Quieres reservar este regalo? Una vez confirmes, ningún otro podrá reservarlo.</p>
          
          <div className="mb-6">
            <label htmlFor="reserverName" className="block text-white/90 font-medium mb-2">Tu nombre (opcional)</label>
            <input 
              type="text" 
              id="reserverName" 
              className="w-full h-[50px] px-3 py-2 border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5883C6] focus:border-transparent bg-[#121212] text-white" 
              placeholder="¿Cómo te llama esta persona?"
              value={reserverName}
              onChange={(e) => setReserverName(e.target.value)}
            />
            <p className="text-white/50 text-xs mt-1">Tranquilo, no le mostraremos tu nombre hasta que lo reciba</p>
          </div>
          
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleConfirm}
              className="w-full bg-primary hover:bg-primary/90 text-black h-[50px]"
            >
              Confirmar reserva
            </Button>
            <SheetClose asChild>
              <Button 
                variant="outline" 
                className="w-full border-[#444] text-white hover:bg-[#2a2a2a] hover:text-white h-[50px]"
              >
                Cancelar
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReservationModal;
