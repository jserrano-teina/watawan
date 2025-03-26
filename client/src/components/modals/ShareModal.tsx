import React, { useRef, useState } from 'react';
import { Copy, X, Share2, Mail } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareableLink: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareableLink }) => {
  const linkRef = useRef<HTMLInputElement>(null);
  
  const fullShareableLink = `${window.location.origin}/share/${shareableLink}`;
  
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
    const subject = 'Mi lista de deseos';
    const body = `¡Hola! He creado una lista de deseos. Puedes verla aquí: ${fullShareableLink}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
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
        
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">Compartir tu lista</h3>
          <button 
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="px-6 mt-4">
          <p className="text-white/80 mb-6">Comparte este enlace con amigos y familiares para que puedan ver tu lista de deseos</p>
          
          <div className="flex items-center mb-6">
            <input 
              ref={linkRef}
              type="text" 
              value={fullShareableLink} 
              readOnly 
              className="flex-grow px-3 py-2 border border-[#333] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-[#121212] text-white"
            />
            <button 
              onClick={copyToClipboard}
              className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary/80 transition-colors"
            >
              <Copy size={18} />
            </button>
          </div>
          
          <div className="flex flex-col gap-4 mt-6">
            <button 
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors"
            >
              <Share2 size={18} className="mr-2" />
              Compartir por WhatsApp
            </button>
            
            <button 
              onClick={shareOnFacebook}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#3b5998] text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors"
            >
              <Share2 size={18} className="mr-2" />
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
