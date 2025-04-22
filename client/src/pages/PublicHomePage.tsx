import React from 'react';
import { Link, useLocation } from 'wouter';

const PublicHomePage: React.FC = () => {
  const [location, setLocation] = useLocation();

  // Función para navegar a la app
  const navigateToApp = () => {
    // En desarrollo, simplemente navegar a la ruta base
    if (window.location.hostname.includes('localhost') || window.location.hostname.includes('replit')) {
      setLocation('/');
    } else {
      // En producción, redirigir al subdominio app
      window.location.href = 'https://app.watawan.com';
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="max-w-[1200px] mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/icons/logo.svg" alt="WataWan" className="h-10 w-10 mr-3" />
          <span className="text-xl font-bold">WataWan</span>
        </div>
        <button 
          onClick={navigateToApp}
          className="bg-primary text-black font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Acceder a la app
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-[1200px] mx-auto px-4 py-12 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Crea, comparte y gestiona tus listas de deseos
          </h1>
          <p className="text-lg text-white/70 max-w-[600px] mx-auto mb-8">
            WataWan te permite crear listas de deseos personalizadas y compartirlas con amigos y familiares. ¡Evita regalos duplicados y asegúrate de recibir lo que realmente quieres!
          </p>
          <button 
            onClick={navigateToApp}
            className="bg-primary text-black font-bold px-6 py-3 rounded-lg text-lg hover:bg-primary/90 transition-colors"
          >
            Comenzar ahora
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
          <div className="bg-[#1a1a1a] p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Crea tu lista de deseos</h3>
            <p className="text-white/60">Añade rápidamente productos de cualquier tienda online. WataWan extrae automáticamente imágenes y detalles del producto.</p>
          </div>
          
          <div className="bg-[#1a1a1a] p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Comparte fácilmente</h3>
            <p className="text-white/60">Comparte tu lista con amigos y familiares mediante un enlace único que pueden abrir sin necesidad de registrarse.</p>
          </div>
          
          <div className="bg-[#1a1a1a] p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="m9 16 2 2 4-4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Evita duplicados</h3>
            <p className="text-white/60">Las personas pueden reservar los regalos que piensan comprar, evitando que otros elijan el mismo regalo.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#0a0a0a] py-8">
        <div className="max-w-[1200px] mx-auto px-4 text-center text-white/40 text-sm">
          <p>© {new Date().getFullYear()} WataWan. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicHomePage;