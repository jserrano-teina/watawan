import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WishItem } from '../../types';
import { sanitizeInput } from '@/lib/sanitize';

interface ReservationModalProps {
  item: WishItem;
  onClose: () => void;
  onConfirm: (reserverName: string) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ item, onClose, onConfirm }) => {
  const [reserverName, setReserverName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reserverName.trim()) {
      setError('Por favor, introduce tu nombre');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onConfirm(reserverName);
      onClose();
    } catch (error) {
      console.error('Error en reserva:', error);
      setError('Ha ocurrido un error al reservar el regalo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-lg w-full max-w-[400px] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium">Reservar regalo</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <p className="mb-2">Estás a punto de reservar:</p>
            <h3 className="text-primary font-medium mb-1">{sanitizeInput(item.title)}</h3>
            {item.price && (
              <p className="text-sm text-gray-300">{item.price}</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reserverName" className="block text-sm font-medium mb-1">
                Tu nombre (para que sepan quién lo ha reservado)
              </label>
              <input
                id="reserverName"
                type="text"
                value={reserverName}
                onChange={(e) => setReserverName(e.target.value)}
                placeholder="Escribe tu nombre"
                className="w-full p-3 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                maxLength={50}
                disabled={isLoading}
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-black font-medium flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Reservando...
                  </span>
                ) : (
                  'Confirmar reserva'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;