import React, { useRef, useState, useEffect } from 'react';
import { Copy, X, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CustomInput } from "@/components/ui/custom-input";
import { useAuth } from "@/hooks/use-auth";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareableLink: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareableLink }) => {
  const linkRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  
  // URL tradicional como fallback
  const legacyShareableLink = `${window.location.origin}/s/${shareableLink}`;

  // Estado para la URL compartible
  const [friendlyShareableUrl, setFriendlyShareableUrl] = useState('');
  
  // Efecto para resetear el estado de copiado cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen === false) {
      // Cuando se cierra el modal, resetear el estado de copiado
      setCopied(false);
    }
  }, [isOpen]);
  
  // Determinar la URL según el entorno
  useEffect(() => {
    if (!user?.displayName) return;
    
    // Función para generar un slug a partir de un texto
    const generateSlug = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD') // Normaliza acentos
        .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
        .replace(/[^\w\s-]/g, '') // Elimina caracteres especiales
        .replace(/\s+/g, '-') // Reemplaza espacios por guiones
        .replace(/-+/g, '-') // Elimina guiones duplicados
        .replace(/^-+|-+$/g, ''); // Elimina guiones del principio y final
    };
    
    // Slug del nombre de usuario
    const userSlug = generateSlug(user.displayName);
    
    // Solo considerar desarrollo si estamos en localhost
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // En desarrollo local, usar la URL actual del host
      setFriendlyShareableUrl(`${window.location.origin}/user/${userSlug}`);
    } else {
      // En todos los demás casos (incluyendo replit.app), usar watawan.com
      setFriendlyShareableUrl(`https://watawan.com/user/${userSlug}`);
    }
    
    // Debug para ver qué URL se está generando
    console.log('Ambiente:', isDevelopment ? 'desarrollo' : 'producción');
    console.log('URL generada:', isDevelopment ? 
      `${window.location.origin}/user/${userSlug}` : 
      `https://watawan.com/user/${userSlug}`
    );
    
  }, [user]);
  
  // URL que se mostrará y compartirá - preferimos la amigable, con fallback a la legacy
  const fullShareableLink = friendlyShareableUrl || legacyShareableLink;
  
  // Debug para ver la URL final
  useEffect(() => {
    console.log('URL final para compartir:', fullShareableLink);
  }, [fullShareableLink]);
  
  const copyToClipboard = () => {
    if (linkRef.current) {
      linkRef.current.select();
      document.execCommand('copy');
      setCopied(true);
    }
  };
  
  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      '¡Hola! He creado una lista de deseos. Puedes verla aquí: ' + fullShareableLink
    )}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullShareableLink)}`;
    window.open(facebookUrl, '_blank');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Comparte tu lista</SheetTitle>
          <SheetDescription>Opciones para compartir tu lista de deseos</SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-start justify-between">
          <h3 className="text-white text-xl font-medium">Comparte tu lista</h3>
          <button 
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1 ml-3 mt-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="px-6 mt-4">
          <p className="text-white/80 mb-6">Comparte este enlace con amigos y familiares para que puedan ver tu lista de deseos</p>
          
          <div className="flex flex-col mb-6">
            <div className="flex items-center">
              <div className="flex-grow relative">
                <CustomInput 
                  ref={linkRef}
                  type="text" 
                  value={fullShareableLink} 
                  readOnly 
                  className="rounded-r-none bg-[#252525]"
                />
              </div>
              <button 
                onClick={copyToClipboard}
                className="bg-primary text-black h-[50px] px-5 rounded-r-lg hover:bg-primary/80 transition-colors flex items-center justify-center"
              >
                <Copy size={18} className="text-black" />
              </button>
            </div>
            
            {copied && (
              <div className="flex items-center mt-2 text-green-500">
                <Check size={14} className="mr-1" />
                <span className="text-sm">Enlace copiado al portapapeles</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4 mt-6">
            <button 
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-black rounded-xl font-medium hover:bg-opacity-90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-black">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" x2="12" y1="2" y2="15"/>
              </svg>
              Compartir por WhatsApp
            </button>
            
            <button 
              onClick={shareOnFacebook}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#3b5998] text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" x2="12" y1="2" y2="15"/>
              </svg>
              Compartir en Facebook
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareModal;
