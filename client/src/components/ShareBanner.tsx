import React from 'react';

interface ShareBannerProps {
  onShareClick: () => void;
}

const ShareBanner: React.FC<ShareBannerProps> = ({ onShareClick }) => {
  return (
    <div className="bg-gradient-to-r from-primary/80 to-primary rounded-xl p-5 mt-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="text-white">
          <h2 className="font-medium text-lg">Comparte tu lista de deseos</h2>
          <p className="text-white/90 text-sm">Tus amigos podrán ver y reservar regalos para ti</p>
        </div>
        <button 
          onClick={onShareClick}
          className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all duration-300 hover:shadow-lg border border-white/10 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
          Compartir
        </button>
      </div>
    </div>
  );
};

export default ShareBanner;
