import React from 'react';
import { sanitizeUrl } from '@/lib/sanitize';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

/**
 * Componente que renderiza un enlace seguro sanitizando la URL
 * y aplicando atributos de seguridad recomendados para enlaces externos
 */
export const SafeLink: React.FC<SafeLinkProps> = ({ 
  href, 
  children, 
  target, 
  rel, 
  ...props 
}) => {
  // Sanitizar la URL
  const safeHref = sanitizeUrl(href);
  
  // Si es un enlace externo, aplicar atributos de seguridad
  const isExternal = safeHref.startsWith('http') && !safeHref.includes(window.location.hostname);
  const safeTarget = isExternal ? '_blank' : target;
  const safeRel = isExternal ? 'noopener noreferrer nofollow' : rel;
  
  return (
    <a 
      href={safeHref} 
      target={safeTarget} 
      rel={safeRel} 
      {...props}
    >
      {children}
    </a>
  );
};