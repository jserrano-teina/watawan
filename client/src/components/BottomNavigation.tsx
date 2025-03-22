import { useLocation } from "wouter";

interface BottomNavigationProps {
  onCreateClick: () => void;
}

export function BottomNavigation({ onCreateClick }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="max-w-screen-sm mx-auto px-2">
        <div className="flex justify-around">
          <button 
            className={`flex flex-col items-center p-2 flex-1 ${location === "/" ? "text-primary" : "text-gray-500"}`}
            onClick={() => setLocation("/")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="text-xs mt-1">Inicio</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 flex-1 text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span className="text-xs mt-1">Buscar</span>
          </button>
          <div className="flex-1 flex justify-center">
            <button 
              className="bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg relative -top-5"
              onClick={onCreateClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
          <button 
            className="flex flex-col items-center p-2 flex-1 text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <span className="text-xs mt-1">Avisos</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 flex-1 text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default BottomNavigation;
