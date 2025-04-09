import React, { useRef } from 'react';
import { Copy, X, Share2, Mail } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CustomInput } from "@/components/ui/custom-input";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareableLink: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareableLink }) => {
  const linkRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const fullShareableLink = `${window.location.origin}/s/${shareableLink}`;
  
  const copyToClipboard = () => {
    if (linkRef.current) {
      linkRef.current.select();
      
      // Usar clipboard API moderna
      navigator.clipboard.writeText(fullShareableLink)
        .then(() => {
          // Mostrar toast en lugar de alerta nativa
          toast({
            title: "Enlace copiado al portapapeles",
            description: "Ya puedes compartirlo con quien quieras"
          });
        })
        .catch(() => {
          // Fallback al método antiguo si la API moderna falla
          document.execCommand('copy');
          toast({
            title: "Enlace copiado al portapapeles"
          });
        });
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
    const body = `¡Hola!\n\nHe creado una lista de deseos en WataWan.\n\nPuedes verla aquí: ${fullShareableLink}\n\n¡Gracias!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Abrir en nueva pestaña para evitar problemas si el usuario cancela la acción
    window.open(mailtoUrl, '_blank');
    
    // Notificar con toast que se abrió el cliente de correo
    toast({
      title: "Abriendo cliente de correo",
      description: "Se abrirá tu cliente de correo predeterminado"
    });
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
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" x2="12" y1="2" y2="15"/>
              </svg>
              Compartir por WhatsApp
            </button>
            
            <button 
              onClick={shareOnFacebook}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#3b5998] text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" x2="12" y1="2" y2="15"/>
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
