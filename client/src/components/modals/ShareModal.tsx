import React, { useRef } from 'react';

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">Compartir tu lista de deseos</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-neutral-600 mb-4">Comparte este enlace con amigos y familiares para que puedan ver tu lista de deseos</p>
          
          <div className="flex items-center mb-6">
            <input 
              ref={linkRef}
              type="text" 
              value={fullShareableLink} 
              readOnly 
              className="flex-grow px-3 py-2 border border-neutral-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-neutral-50"
            />
            <button 
              onClick={copyToClipboard}
              className="bg-secondary text-white px-4 py-2 rounded-r-lg"
            >
              <i className="fas fa-copy"></i>
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-lg font-medium"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Compartir por WhatsApp
            </button>
            <button 
              onClick={shareOnFacebook}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#3b5998] text-white rounded-lg font-medium"
            >
              <i className="fab fa-facebook text-xl"></i>
              Compartir en Facebook
            </button>
            <button 
              onClick={shareByEmail}
              className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-100 text-neutral-800 rounded-lg font-medium"
            >
              <i className="fas fa-envelope text-xl"></i>
              Enviar por email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
