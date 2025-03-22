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
    <header className="sticky top-0 bg-white shadow-sm z-30">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-secondary">
            <i className="fas fa-gift text-primary mr-2"></i>Wishify
          </h1>
        </div>
        <div className="flex items-center">
          <button 
            onClick={toggleMenu}
            className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center"
          >
            <span className="text-neutral-600 font-medium">
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
