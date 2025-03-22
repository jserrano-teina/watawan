import React, { useState } from 'react';
import { WishItem } from '../../types';

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
  
  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    onConfirm(reserverName);
    setReserverName('');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">Confirmar reserva</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-neutral-600 mb-4">¿Estás seguro que quieres reservar este regalo? Una vez confirmado, nadie más podrá reservarlo.</p>
          
          <div className="p-3 bg-neutral-100 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-neutral-200 rounded overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-gift text-neutral-400"></i>
                )}
              </div>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-neutral-600 text-sm">{item.description}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="reserverName" className="block text-neutral-700 font-medium mb-1">Tu nombre (opcional)</label>
            <input 
              type="text" 
              id="reserverName" 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent" 
              placeholder="¿Cómo quieres que te conozcan?"
              value={reserverName}
              onChange={(e) => setReserverName(e.target.value)}
            />
            <p className="text-neutral-500 text-xs mt-1">Esto es solo para ti, no se mostrará a la persona que recibirá el regalo</p>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleConfirm}
              className="px-4 py-2 bg-success text-white rounded-lg font-medium"
            >
              Confirmar reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
