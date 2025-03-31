import React, { useState, useEffect } from 'react';
import { WishItem } from '../../types';
import { Button } from "@/components/ui/button";
import { Gift, X } from 'lucide-react';

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
  const [sheetVisible, setSheetVisible] = useState(false);
  
  // Gestionar la animación de entrada y salida
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll
      document.body.style.overflow = 'hidden';
      // Animar la entrada
      setTimeout(() => {
        setSheetVisible(true);
      }, 10);
    } else {
      // Animar la salida
      setSheetVisible(false);
      // Desbloquear scroll después de la animación
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 300);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSheetVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm(reserverName);
    setReserverName('');
    handleClose();
  };
  
  // Si no hay item o no está abierto, no renderizar nada
  if (!item || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 overflow-hidden">
      {/* Fondo oscurecido con cierre al tocar */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: sheetVisible ? 1 : 0 }}
        onClick={handleClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] text-white border-t border-[#333] rounded-t-xl max-h-[85vh] overflow-auto transform transition-transform duration-300 ease-out"
        style={{ transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Indicador de arrastre */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-[#333] rounded-full"></div>
        </div>
        
        {/* Encabezado con botón de cierre */}
        <div className="flex justify-between items-center px-4 pb-2">
          <h2 className="text-white text-lg font-semibold">Confirmar reserva</h2>
          <button 
            onClick={handleClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#252525]"
          >
            <X size={18} className="text-white/70" />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="px-4 py-3">
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
                  <p className="text-white/60 text-sm line-clamp-2">{item.description}</p>
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
          
          {/* Botones */}
          <div className="flex gap-3 pt-2 pb-6">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 border-[#444] text-white hover:bg-[#2a2a2a] hover:text-white h-[50px]"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-[50px]"
            >
              Confirmar reserva
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
