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
    // Header vacío - top-bar eliminada
    <header className="hidden">
      {showMenu && (
        <ProfileMenu onClose={closeMenu} />
      )}
    </header>
  );
};

export default Header;
