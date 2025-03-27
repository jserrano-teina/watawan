import React, { useEffect, useState } from 'react';
import { WishItem } from '../../types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProductImage from '../ProductImage';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, ExternalLink, Calendar, X, ArrowLeft, Check, MoreVertical, Trash } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

interface WishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
}

const DesktopView = ({ 
  item, 
  onClose, 
  onEdit, 
  onDelete,
  isOpen 
}: { 
  item: WishItem;
  onClose: () => void;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  isOpen: boolean;
}) => {
  const [openSheet, setOpenSheet] = useState(false);
  
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { 
    addSuffix: true,
    locale: es
  });

  // Extraer ASIN de Amazon si está disponible
  const getProductId = (): string | undefined => {
    if (!item.purchaseLink) return undefined;
    
    // Extraer ASIN de URLs de Amazon
    if (item.purchaseLink.includes('amazon')) {
      const asinMatch = item.purchaseLink.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (asinMatch && asinMatch[1]) {
        return asinMatch[1];
      }
    }
    return undefined;
  };

  const productId = getProductId();

  const handleEdit = () => {
    onEdit(item);
    setOpenSheet(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      setOpenSheet(false);
      onClose();
    }
  };
  
  // Función para abrir enlace externamente
  const openExternalLink = () => {
    window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    setOpenSheet(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[#121212] text-white border-[#333]">
        <div className="relative">
          {/* Header con título */}
          <div className="flex items-center justify-between p-4 border-b border-[#333]">
            <h1 className="text-lg font-medium">Detalle del producto</h1>
            <button 
              onClick={onClose}
              className="p-2 rounded-full text-white/80 hover:bg-[#252525] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Contenido con scroll */}
          <div className="max-h-[calc(80vh-150px)] overflow-y-auto">
            {/* Imagen principal */}
            <div className="h-60 w-full bg-[#202020] relative">
              <ProductImage 
                imageUrl={item.imageUrl} 
                productId={productId}
                title={item.title}
                purchaseLink={item.purchaseLink}
                className="w-full h-full object-contain"
              />
              
              {/* Eliminamos la superposición */}
            </div>

            {/* Detalles del producto */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                <Sheet 
                  open={openSheet} 
                  onOpenChange={setOpenSheet}
                >
                  <SheetTrigger asChild>
                    <button 
                      className="p-1 hover:bg-[#252525] rounded-full transition-colors"
                      aria-label="Opciones"
                    >
                      <MoreVertical size={20} className="text-white/70" />
                    </button>
                  </SheetTrigger>
                  <SheetContent 
                    side="bottom" 
                    className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
                  >
                    <SheetHeader className="sr-only">
                      <SheetTitle>{item.title}</SheetTitle>
                      <SheetDescription>Opciones para gestionar este deseo</SheetDescription>
                    </SheetHeader>
                    <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
                      <h3 className="text-white text-xl font-medium">{item.title}</h3>
                      <button 
                        onClick={() => setOpenSheet(false)}
                        className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
                      >
                        <X className="h-7 w-7" />
                      </button>
                    </div>
                    
                    <div className="mt-4 flex flex-col">
                      <button 
                        onClick={handleEdit}
                        className={`w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}
                        disabled={item.isReserved}
                      >
                        <Edit size={22} className="mr-4" />
                        Editar
                      </button>
                      
                      <button 
                        onClick={openExternalLink}
                        className="w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center"
                      >
                        <ExternalLink size={22} className="mr-4" />
                        Ir al enlace de compra
                      </button>
                      
                      <button 
                        onClick={handleDelete}
                        className="w-full text-left px-6 py-5 text-[17px] text-red-400 hover:bg-[#333] flex items-center"
                      >
                        <Trash size={22} className="mr-4" />
                        Eliminar
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              {item.price && (
                <div className="flex items-center mb-4">
                  <div className="inline-block px-3 py-1 bg-primary/20 rounded-lg text-primary font-medium text-sm">
                    {item.price}
                  </div>
                </div>
              )}
              
              {/* Descripción */}
              {item.description && (
                <div className="mb-6">
                  <h3 className="block text-white text-sm mb-2">Descripción</h3>
                  <p className="text-white/80 text-sm">{item.description}</p>
                </div>
              )}
              
              {/* Enlace externo */}
              <div className="mb-6">
                <h3 className="block text-white text-sm mb-2">Enlace de compra</h3>
                <a 
                  href={item.purchaseLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-primary text-sm max-w-full"
                >
                  <span className="truncate mr-2">{item.purchaseLink}</span>
                  <ExternalLink size={16} className="flex-shrink-0" />
                </a>
              </div>
              
              {/* Información adicional */}
              <div className="flex items-center text-xs text-white/60 mb-3">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  <span>Añadido {formattedDate}</span>
                </div>
              </div>
              
              {/* Banner de reservado */}
              {item.isReserved && (
                <div className="bg-green-800/20 border border-green-800/30 rounded-xl p-4 mb-4 flex items-center">
                  <div className="w-9 h-9 bg-green-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Alguien ha reservado este regalo para ti, ¡pronto sabrás quién es!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer con botones */}
          <div className="flex justify-between p-4 border-t border-[#333] bg-[#121212]">
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-[#333] rounded-lg text-white text-sm font-medium hover:bg-[#252525] transition-colors flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </button>
            <div className="flex gap-2">
              <a 
                href={item.purchaseLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 border border-[#333] rounded-lg text-white text-sm font-medium hover:bg-[#252525] transition-colors flex items-center"
              >
                <ExternalLink size={16} className="mr-2" />
                Ir al enlace de compra
              </a>
              <button
                onClick={handleEdit}
                disabled={item.isReserved}
                className={`px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center ${item.isReserved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <Edit size={16} className="mr-2" />
                Editar
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MobileView = ({ 
  item, 
  onClose, 
  onEdit, 
  onDelete 
}: {
  item: WishItem;
  onClose: () => void;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
}) => {
  const [openSheet, setOpenSheet] = useState(false);
  
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { 
    addSuffix: true,
    locale: es
  });

  // Extraer ASIN de Amazon si está disponible
  const getProductId = (): string | undefined => {
    if (!item.purchaseLink) return undefined;
    
    // Extraer ASIN de URLs de Amazon
    if (item.purchaseLink.includes('amazon')) {
      const asinMatch = item.purchaseLink.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (asinMatch && asinMatch[1]) {
        return asinMatch[1];
      }
    }
    return undefined;
  };

  const productId = getProductId();

  const handleEdit = () => {
    onEdit(item);
    setOpenSheet(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      setOpenSheet(false);
      onClose();
    }
  };
  
  // Función para abrir enlace externamente
  const openExternalLink = () => {
    window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    setOpenSheet(false);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col">
      <div className="flex-1 overflow-auto pb-28">
        {/* Imagen principal a sangre */}
        <div className="w-full bg-[#202020] relative">
          {/* Botón de regreso flotante, ahora fixed para mantenerlo visible al hacer scroll */}
          <button 
            onClick={onClose}
            className="fixed top-4 left-4 z-30 bg-[#252525]/80 p-2 rounded-full text-white/90 hover:bg-[#333] transition-colors shadow-lg backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="h-80 w-full">
            <ProductImage 
              imageUrl={item.imageUrl} 
              productId={productId}
              title={item.title}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Eliminamos la superposición */}
        </div>

        {/* Detalles del producto */}
        <div className="p-6">
          {/* Nombre del producto con mayor tamaño y peso */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
            <Sheet 
              open={openSheet} 
              onOpenChange={setOpenSheet}
            >
              <SheetTrigger asChild>
                <button 
                  className="p-1 hover:bg-[#252525] rounded-full transition-colors"
                  aria-label="Opciones"
                >
                  <MoreVertical size={20} className="text-white/70" />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>{item.title}</SheetTitle>
                  <SheetDescription>Opciones para gestionar este deseo</SheetDescription>
                </SheetHeader>
                <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
                  <h3 className="text-white text-xl font-medium">{item.title}</h3>
                  <button 
                    onClick={() => setOpenSheet(false)}
                    className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
                  >
                    <X className="h-7 w-7" />
                  </button>
                </div>
                
                <div className="mt-4 flex flex-col">
                  <button 
                    onClick={handleEdit}
                    className={`w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}
                    disabled={item.isReserved}
                  >
                    <Edit size={22} className="mr-4" />
                    Editar
                  </button>
                  
                  <button 
                    onClick={openExternalLink}
                    className="w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center"
                  >
                    <ExternalLink size={22} className="mr-4" />
                    Ir al enlace de compra
                  </button>
                  
                  <button 
                    onClick={handleDelete}
                    className="w-full text-left px-6 py-5 text-[17px] text-red-400 hover:bg-[#333] flex items-center"
                  >
                    <Trash size={22} className="mr-4" />
                    Eliminar
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Precio como texto normal de mayor tamaño */}
          {item.price && (
            <div className="mb-2">
              <span className="text-white text-xl font-medium">
                {item.price}
              </span>
            </div>
          )}
          
          {/* Fecha de adición con color secundario y mejor formato */}
          <div className="text-gray-400 text-sm mb-5">
            Añadido {formattedDate}
          </div>
          
          {/* Banner de reservado */}
          {item.isReserved && (
            <div className="bg-green-800/20 border border-green-800/30 rounded-xl p-4 mb-6 flex items-center">
              <div className="w-10 h-10 bg-green-800/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">Alguien ha reservado este regalo para ti, ¡pronto sabrás quién es!</p>
              </div>
            </div>
          )}
          
          {/* Enlace externo - ahora antes de la descripción */}
          <div className="mb-6">
            <h3 className="block text-white text-sm mb-2">Enlace de compra</h3>
            <a 
              href={item.purchaseLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between text-primary text-sm max-w-full"
            >
              <span className="truncate mr-2">{item.purchaseLink}</span>
              <ExternalLink size={16} className="flex-shrink-0" />
            </a>
          </div>
          
          {/* Descripción */}
          {item.description && (
            <div className="mb-6">
              <h3 className="block text-white text-sm mb-2">Descripción</h3>
              <p className="text-white/80 text-sm">{item.description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer con botones fijos */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-between bg-[#121212] p-4 border-t border-[#333]">
        <button
          onClick={handleDelete}
          className="px-6 py-3 border border-[#333] rounded-lg text-white font-medium hover:bg-[#252525] transition-colors flex items-center"
        >
          <Trash2 size={16} className="mr-2" />
          Eliminar
        </button>
        <button
          onClick={handleEdit}
          disabled={item.isReserved}
          className={`px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center ${item.isReserved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          <Edit size={16} className="mr-2" />
          Editar
        </button>
      </div>
    </div>
  );
};

const WishDetailModal: React.FC<WishDetailModalProps> = (props) => {
  const { isOpen, item } = props;
  const isMobile = useIsMobile();
  
  if (!isOpen || !item) return null;
  
  return isMobile ? <MobileView {...props} item={item} /> : <DesktopView {...props} item={item} />;
}

export default WishDetailModal;