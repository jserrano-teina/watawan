import { useState } from "react";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showShareButton?: boolean;
  showEditButton?: boolean;
  onShareClick?: () => void;
  onEditClick?: () => void;
  user?: {
    initials: string;
    name?: string;
    subtitle?: string;
  }
}

export function Header({
  title,
  showBackButton = false,
  showShareButton = false,
  showEditButton = false,
  onShareClick,
  onEditClick,
  user
}: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <header className="bg-white shadow sticky top-0 z-10">
      <div className="max-w-screen-sm mx-auto px-4 py-3">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={handleBack}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {showShareButton && (
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={onShareClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
            )}
            {showEditButton && (
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={onEditClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
            )}
          </div>
        </div>
        
        {user && (
          <div className="flex items-center mt-1 gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
              <span>{user.initials}</span>
            </div>
            <div>
              {user.name && <div className="text-sm font-medium">{user.name}</div>}
              {user.subtitle && <div className="text-xs text-gray-500">{user.subtitle}</div>}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
