import React, { useRef } from 'react';
import { Copy, X, Share2, Mail } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareableLink: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareableLink }) => {
  const linkRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
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
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[#121212] text-white rounded-lg w-full max-w-md mx-4 shadow-xl border border-[#333]">
        <div className="flex justify-between items-center p-4 border-b border-[#333]">
          <h2 className="text-lg font-semibold">Compartir tu lista de deseos</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
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
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              <Share2 size={18} />
              Compartir por WhatsApp
            </button>
            <button 
              onClick={shareOnFacebook}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#3b5998] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              <Share2 size={18} />
              Compartir en Facebook
            </button>
            <button 
              onClick={shareByEmail}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#202020] hover:bg-[#303030] text-white rounded-lg font-medium transition-colors"
            >
              <Mail size={18} />
              Enviar por email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
