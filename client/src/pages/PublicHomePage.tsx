import React from 'react';
import { useLocation } from 'wouter';

/**
 * Página de inicio pública provisional para watawan.com
 * En el futuro, esta página será reemplazada por un sitio web completo
 */
const PublicHomePage: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleOpenApp = () => {
    // Redirigir a la aplicación
    window.location.href = 'https://app.watawan.com/';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] text-white p-6">
      <div className="max-w-[600px] mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">Bienvenido a WataWan</h1>
        
        <p className="mb-8 text-xl text-white/80">
          Crea y comparte listas de deseos con amigos y familiares.
          Esta es la página pública de WataWan.
        </p>
        
        <button 
          onClick={handleOpenApp}
          className="px-8 py-3 bg-primary text-black font-bold rounded-lg text-lg hover:bg-primary/90 transition-colors"
        >
          Abrir la aplicación
        </button>
        
        <p className="mt-16 text-white/60">
          Para acceder a una lista de deseos compartida, utiliza el enlace que te han proporcionado.
        </p>
      </div>
    </div>
  );
};

export default PublicHomePage;