import React, { useEffect, useRef } from 'react';

interface ProfileMenuProps {
  onClose: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="absolute right-4 top-16 bg-[#1e1e1e] shadow-xl rounded-xl w-52 z-40 border border-[#333] overflow-hidden"
    >
      <ul className="py-1">
        <li className="px-4 py-3 hover:bg-[#252525] cursor-pointer transition-colors duration-200 text-white">
          <i className="fas fa-user mr-3 text-primary/80"></i>
          <span>Mi perfil</span>
        </li>
        <li className="px-4 py-3 hover:bg-[#252525] cursor-pointer transition-colors duration-200 text-white">
          <i className="fas fa-cog mr-3 text-primary/80"></i>
          <span>Configuración</span>
        </li>
        <li className="border-t border-[#333] px-4 py-3 hover:bg-[#252525] cursor-pointer text-primary transition-colors duration-200">
          <i className="fas fa-sign-out-alt mr-3"></i>
          <span>Cerrar sesión</span>
        </li>
      </ul>
    </div>
  );
};

export default ProfileMenu;
