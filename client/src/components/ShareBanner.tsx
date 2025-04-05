import React from 'react';

interface ShareBannerProps {
  onShareClick: () => void;
}

const ShareBanner: React.FC<ShareBannerProps> = ({ onShareClick }) => {
  return (
    <div className="bg-gradient-to-r from-[#5883C6]/20 to-[#5883C6]/40 rounded-xl p-5 mt-6 shadow-lg border border-[#5883C6]/30">
      <div className="flex items-center justify-between">
        <div className="text-white">
          <h2 className="font-medium text-lg">Comparte tu lista de deseos</h2>
        </div>
        <button 
          onClick={onShareClick}
          className="bg-[#5883C6] hover:bg-[#4A76B9] text-white p-2.5 rounded-lg font-medium shadow-sm transition-all duration-300 hover:shadow-md border border-[#5883C6]/40 flex items-center justify-center"
          aria-label="Compartir"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
        </button>
      </div>
    </div>
  );
};

export default ShareBanner;
