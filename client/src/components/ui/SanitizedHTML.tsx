import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

interface SanitizedHTMLProps {
  html: string;
  className?: string;
}

/**
 * Componente que muestra HTML sanitizado de forma segura
 */
export const SanitizedHTML: React.FC<SanitizedHTMLProps> = ({ html, className }) => {
  // Sanitizar el HTML
  const sanitizedHtml = sanitizeHtml(html);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};