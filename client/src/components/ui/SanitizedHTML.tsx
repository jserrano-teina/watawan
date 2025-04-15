import React from 'react';
import { sanitizeInput } from '@/lib/sanitize';

interface SanitizedHTMLProps {
  html: string | null | undefined;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

/**
 * Componente para renderizar HTML sanitizado de manera segura
 * Previene ataques XSS al sanitizar el contenido antes de renderizarlo
 */
export function SanitizedHTML({ 
  html, 
  className = '',
  tag: Tag = 'div'
}: SanitizedHTMLProps) {
  // Si no hay contenido, no renderizar nada
  if (!html) return null;
  
  // Sanitizar el HTML antes de renderizarlo
  const sanitizedHTML = sanitizeInput(html);
  
  // Renderizar el contenido sanitizado
  return (
    <Tag 
      className={className} 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}