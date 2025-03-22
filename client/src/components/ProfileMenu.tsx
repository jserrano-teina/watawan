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
      className="absolute right-4 top-16 bg-white shadow-lg rounded-lg w-48 z-40"
    >
      <ul className="py-2">
        <li className="px-4 py-2 hover:bg-neutral-100 cursor-pointer">
          <i className="fas fa-user mr-2 text-neutral-500"></i>
          <span>Mi perfil</span>
        </li>
        <li className="px-4 py-2 hover:bg-neutral-100 cursor-pointer">
          <i className="fas fa-cog mr-2 text-neutral-500"></i>
          <span>Configuración</span>
        </li>
        <li className="border-t border-neutral-200 px-4 py-2 hover:bg-neutral-100 cursor-pointer text-error">
          <i className="fas fa-sign-out-alt mr-2"></i>
          <span>Cerrar sesión</span>
        </li>
      </ul>
    </div>
  );
};

export default ProfileMenu;
