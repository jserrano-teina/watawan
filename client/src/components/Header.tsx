import React, { useState } from 'react';
import { User } from '../types';
import ProfileMenu from './ProfileMenu';

interface HeaderProps {
  user?: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  return (
    <header className="sticky top-0 bg-[#1a1a1a] shadow-md z-30 border-b border-[#333]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <i className="fas fa-gift text-primary mr-2"></i>Wishify
          </h1>
        </div>
        <div className="flex items-center">
          <button 
            onClick={toggleMenu}
            className="w-10 h-10 rounded-full bg-[#252525] overflow-hidden flex items-center justify-center border border-[#333] transition-all duration-300 hover:bg-[#333]"
          >
            <span className="text-white font-medium">
              {user?.initials || 'U'}
            </span>
          </button>
        </div>
      </div>
      
      {showMenu && (
        <ProfileMenu onClose={closeMenu} />
      )}
    </header>
  );
};

export default Header;
