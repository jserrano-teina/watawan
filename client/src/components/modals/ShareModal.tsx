import React, { useRef, useState } from 'react';
import { Copy, X, Share2, Mail } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CustomInput } from "@/components/ui/custom-input";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareableLink: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareableLink }) => {
  const linkRef = useRef<HTMLInputElement>(null);
  
  const fullShareableLink = `${window.location.origin}/s/${shareableLink}`;
  
  const copyToClipboard = () => {
    if (linkRef.current) {
      linkRef.current.select();
      document.execCommand('copy');
      alert('¡Enlace copiado al portapapeles!');
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
  
  const shareByEmail = () => {
    const subject = 'Mi lista de deseos en WataWan';
    const body = `¡Hola!\n\nHe creado una lista de deseos en WataWan. Puedes verla aquí:\n${fullShareableLink}\n\nSaludos!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Usar window.open en lugar de window.location.href para no interrumpir la experiencia actual
    window.open(mailtoUrl, '_blank');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Compartir lista de deseos</SheetTitle>
          <SheetDescription>Opciones para compartir tu lista de deseos</SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-start justify-between">
          <h3 className="text-white text-xl font-medium">Compartir tu lista</h3>
          <button 
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1 ml-3 mt-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="px-6 mt-4">
          <p className="text-white/80 mb-6">Comparte este enlace con amigos y familiares para que puedan ver tu lista de deseos</p>
          
          <div className="flex items-center mb-6">
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
          
          <div className="flex flex-col gap-4 mt-6">
            <button 
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M3 20.01c2.887-1.186 4.347-2.34 5.52-5 .32-.724-3.52-1-3.52-5a7 7 0 0 1 14 0c0 4-3.84 4.276-3.52 5 1.173 2.66 2.633 3.814 5.52 5" />
              </svg>
              Compartir por WhatsApp
            </button>
            
            <button 
              onClick={shareOnFacebook}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#3b5998] text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              Compartir en Facebook
            </button>
            
            <button 
              onClick={shareByEmail}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#202020] hover:bg-[#303030] text-white rounded-xl font-medium transition-colors"
            >
              <Mail size={18} className="mr-2" />
              Enviar por email
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareModal;
