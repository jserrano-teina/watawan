import React from 'react';

interface ShareBannerProps {
  onShareClick: () => void;
}

const ShareBanner: React.FC<ShareBannerProps> = ({ onShareClick }) => {
  return (
    <div className="bg-gradient-to-r from-secondary to-primary rounded-lg p-4 mt-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-white">
          <h2 className="font-medium text-lg">Comparte tu lista de deseos</h2>
          <p className="text-white/90 text-sm">Tus amigos podrán ver y reservar regalos para ti</p>
        </div>
        <button 
          onClick={onShareClick}
          className="bg-white text-primary px-4 py-2 rounded-lg font-medium shadow-sm"
        >
          Compartir
        </button>
      </div>
    </div>
  );
};

export default ShareBanner;
