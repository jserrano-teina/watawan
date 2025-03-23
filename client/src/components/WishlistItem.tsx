import { useState } from "react";
import ProductImage from "./ProductImage";

interface WishlistItemProps {
  item: {
    id: number;
    name: string;
    description?: string;
    price?: string;
    link: string;
    store?: string;
    imageUrl?: string;
    isReserved?: boolean;
    isReservedByVisitor?: boolean;
    reservation?: {
      id: number;
      reservedAt: Date;
    } | null;
  };
  isVisitorView?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onReserve?: (id: number) => void;
  onCancelReservation?: (id: number) => void;
  onReleaseReservation?: (id: number) => void;
}

export function WishlistItem({
  item,
  isVisitorView = false,
  onEdit,
  onDelete,
  onReserve,
  onCancelReservation,
  onReleaseReservation
}: WishlistItemProps) {
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  const isReservedByMe = item.isReservedByVisitor;
  
  return (
    <div className={`
      bg-white rounded-xl shadow-sm border overflow-hidden
      ${item.isReserved && !isReservedByMe ? 'opacity-75 border-gray-100' : ''}
      ${isReservedByMe ? 'border-2 border-primary' : 'border-gray-100'}
    `}>
      <div className="flex">
        <div className="w-32 h-32 shrink-0 relative">
          <div className={`w-full h-full ${item.isReserved && !isReservedByMe ? 'filter grayscale' : ''}`}>
            <ProductImage 
              imageUrl={item.imageUrl} 
              title={item.name}
              purchaseLink={item.link}
              className={`w-full h-full object-cover`}
            />
          </div>
          
          {item.isReserved && !isReservedByMe && (
            <div className="absolute inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><circle cx="12" cy="10" r="2"/><path d="M12 12v3"/></svg>
            </div>
          )}
          
          {isReservedByMe && (
            <div className="absolute top-0 left-0 bg-primary text-white px-2 py-1 text-xs font-medium">
              Reservado por ti
            </div>
          )}
        </div>
        
        <div className="p-3 flex-1 flex flex-col">
          <div className="flex justify-between">
            <h3 className="font-medium">{item.name}</h3>
            <div className="ml-2 shrink-0">
              {item.isReserved ? (
                isReservedByMe ? (
                  <span className="text-xs bg-primary bg-opacity-10 text-primary px-2 py-0.5 rounded-full">
                    Tu reserva
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                    Reservado
                  </span>
                )
              ) : (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Disponible
                </span>
              )}
            </div>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          )}
          
          {item.store && (
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span>{item.store}</span>
            </div>
          )}
          
          {item.price && (
            <div className={`font-medium mt-auto ${item.isReserved && !isReservedByMe ? 'text-gray-500' : 'text-primary'}`}>
              {item.price} €
            </div>
          )}
          
          <div className="flex justify-between items-center mt-2">
            {isVisitorView ? (
              <>
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary font-medium flex items-center"
                  onClick={handleLinkClick}
                >
                  Ver producto 
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                </a>
                
                {item.isReserved ? (
                  isReservedByMe && (
                    <button 
                      className="text-error bg-error bg-opacity-10 px-3 py-1 rounded-lg text-sm font-medium"
                      onClick={() => onCancelReservation && onCancelReservation(item.id)}
                    >
                      Cancelar
                    </button>
                  )
                ) : (
                  <button 
                    className="text-white bg-primary px-3 py-1 rounded-lg text-sm font-medium"
                    onClick={() => onReserve && onReserve(item.id)}
                  >
                    Reservar
                  </button>
                )}
              </>
            ) : (
              <>
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary font-medium flex items-center"
                  onClick={handleLinkClick}
                >
                  Ver producto 
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                </a>
                
                {item.isReserved ? (
                  <button 
                    className="text-sm text-primary font-medium"
                    onClick={() => onReleaseReservation && onReleaseReservation(item.id)}
                  >
                    Liberar
                  </button>
                ) : (
                  <div className="flex space-x-1">
                    <button 
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      onClick={() => onEdit && onEdit(item.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                      className="p-1 text-gray-500 hover:text-error rounded"
                      onClick={() => onDelete && onDelete(item.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WishlistItem;
