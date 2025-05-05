import React, { useEffect, useRef, ReactNode } from 'react';
import { useDeviceContext } from '@/hooks/useDeviceContext';
import { useSafeArea } from '@/hooks/useSafeArea';
import { cn } from '@/lib/utils';

interface PwaLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  hasScroll?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Componente de layout especial para PWA que maneja correctamente
 * el posicionamiento de la barra de navegación fija y evita los problemas de scroll
 */
export const PwaLayout: React.FC<PwaLayoutProps> = ({
  children,
  header,
  footer,
  hasScroll = true,
  className,
  contentClassName
}) => {
  const { isPwa, isIOS, hasHomeIndicator, needsScrollLock } = useDeviceContext();
  const safeArea = useSafeArea();
  const contentRef = useRef<HTMLDivElement>(null);

  // Efecto para manejar los problemas de scroll en PWA
  useEffect(() => {
    if (!contentRef.current || !isPwa) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!hasScroll && needsScrollLock) {
        e.preventDefault();
      }
    };

    const content = contentRef.current;
    
    // Solo prevenimos el scroll si específicamente no lo queremos
    if (!hasScroll && needsScrollLock) {
      content.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (!hasScroll && needsScrollLock) {
        content.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isPwa, hasScroll, needsScrollLock]);

  // Estilos específicos para ajustar el layout según el dispositivo y entorno
  const layoutStyles: React.CSSProperties = {
    // Aseguramos que el layout ocupe toda la altura disponible
    minHeight: '100vh',
    // Evitamos cualquier overflow del contenedor principal
    overflow: 'hidden',
    // Forzamos a usar el modelo de caja correctamente
    boxSizing: 'border-box',
    // No permitimos que el contenido se desborde
    margin: 0,
    padding: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  };

  // Estilos para el contenido que varían según si debe tener scroll o no
  const contentStyles: React.CSSProperties = {
    // Hacemos que el contenido ocupe el espacio disponible entre header y footer
    flex: 1,
    // Comportamiento de scroll basado en la prop hasScroll
    overflowY: hasScroll ? 'auto' : 'hidden',
    overflowX: 'hidden',
    // Optimizaciones para scroll en dispositivos táctiles
    WebkitOverflowScrolling: 'touch',
    // Evitamos el efecto de rebote en iOS
    overscrollBehavior: 'none',
    // Para prevenir el arrastre de la UI en PWA
    touchAction: hasScroll ? 'pan-y' : 'none',
    // Espacio inferior para evitar que el contenido quede debajo del footer
    paddingBottom: hasScroll ? `calc(${safeArea.bottom + 64}px)` : 0
  };

  // Estilos para el footer (navbar)
  const footerStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backdropFilter: 'blur(10px)',
    transform: 'translateZ(0)',
    willChange: 'transform',
    // Aseguramos que permanezca visible
    visibility: 'visible',
    // Espacio inferior adicional para iOS con home indicator
    paddingBottom: isIOS && hasHomeIndicator ? `calc(${safeArea.bottom}px + 4px)` : '4px'
  };

  return (
    <div 
      className={cn("pwa-layout", isPwa ? 'is-pwa' : '', className)}
      style={layoutStyles}
      data-pwa={isPwa ? 'true' : 'false'}
      data-ios={isIOS ? 'true' : 'false'}
      data-has-home-indicator={hasHomeIndicator ? 'true' : 'false'}
    >
      {/* Header */}
      {header && (
        <header className="pwa-layout-header">
          {header}
        </header>
      )}

      {/* Contenido con scroll configurable */}
      <div 
        ref={contentRef}
        className={cn(
          "pwa-layout-content",
          hasScroll ? "scrollable-content" : "non-scrollable-content",
          contentClassName
        )}
        style={contentStyles}
      >
        {children}
      </div>

      {/* Footer (navbar) fijo al bottom */}
      {footer && (
        <footer 
          className="pwa-layout-footer"
          style={footerStyles}
        >
          {footer}
        </footer>
      )}
    </div>
  );
};

export default PwaLayout;