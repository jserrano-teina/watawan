import React from 'react';
import { sanitizeUrl } from '@/lib/sanitize';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

/**
 * Componente para renderizar enlaces de manera segura
 * Sanitiza las URLs para prevenir ataques XSS
 */
export function SafeLink({ 
  href, 
  children, 
  target = '_blank',
  rel = 'noopener noreferrer', 
  ...props 
}: SafeLinkProps) {
  // Sanitizar la URL
  const safeUrl = sanitizeUrl(href);
  
  // Si la URL no es segura, no renderizar nada o mostrar un mensaje
  if (!safeUrl) {
    console.warn('Se intentó renderizar un enlace con una URL no segura:', href);
    return <span {...props}>{children}</span>;
  }
  
  // Asegurar que enlaces externos siempre tengan target="_blank" y rel="noopener noreferrer"
  return (
    <a 
      href={safeUrl} 
      target={target}
      rel={rel}
      {...props}
    >
      {children}
    </a>
  );
}