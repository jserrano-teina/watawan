import { useState, useEffect } from 'react';

export interface DeviceContext {
  isPwa: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasHomeIndicator: boolean;
  hasNavBar: boolean;
  hasNotch: boolean;
  appBarHeight: number;
  navBarHeight: number;
  needsScrollLock: boolean;
}

/**
 * Hook para detectar el contexto del dispositivo y entorno
 * Proporciona información sobre el dispositivo, sistema operativo y modo de visualización
 */
export function useDeviceContext(): DeviceContext {
  const [context, setContext] = useState<DeviceContext>({
    isPwa: false,
    isIOS: false,
    isAndroid: false,
    hasHomeIndicator: false,
    hasNavBar: false,
    hasNotch: false,
    appBarHeight: 56,
    navBarHeight: 64,
    needsScrollLock: false
  });

  useEffect(() => {
    // Detectar si es PWA
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone || 
                  document.referrer.includes('android-app://');
    
    // Detectar sistema operativo
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/.test(userAgent);
    
    // Detectar características del dispositivo
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const aspectRatio = windowWidth / windowHeight;
    
    // iPhone X o posterior con home indicator
    const hasHomeIndicator = isIOS && (
      // iPhone X/XS/11 Pro
      (windowWidth === 375 && windowHeight === 812) ||
      // iPhone XR/11/XS Max/11 Pro Max
      (windowWidth === 414 && windowHeight === 896) ||
      // iPhone 12 mini
      (windowWidth === 360 && windowHeight === 780) ||
      // iPhone 12/12 Pro
      (windowWidth === 390 && windowHeight === 844) ||
      // iPhone 12 Pro Max
      (windowWidth === 428 && windowHeight === 926) ||
      // iPhone 13 mini
      (windowWidth === 360 && windowHeight === 780) ||
      // iPhone 13/13 Pro
      (windowWidth === 390 && windowHeight === 844) ||
      // iPhone 13 Pro Max/14 Plus
      (windowWidth === 428 && windowHeight === 926) ||
      // iPhone 14
      (windowWidth === 390 && windowHeight === 844) ||
      // iPhone 14 Pro
      (windowWidth === 393 && windowHeight === 852) ||
      // iPhone 14 Pro Max
      (windowWidth === 430 && windowHeight === 932) ||
      // O regla general para nuevos dispositivos
      (isIOS && aspectRatio < 0.5)
    );
    
    // Android con barra de navegación o notch
    const hasNavBar = isAndroid && windowHeight / windowWidth > 1.7;
    
    // Detección aproximada de notch
    const hasNotch = (isIOS && windowWidth >= 375 && windowHeight >= 812) || 
                    (isAndroid && aspectRatio < 0.5);
    
    // Altura de la barra de aplicación
    const appBarHeight = 56;
    
    // Altura de la barra de navegación
    const navBarHeight = hasHomeIndicator ? 84 : (hasNavBar ? 64 : 56);
    
    // Determinar si necesita bloqueo de scroll en PWA
    const needsScrollLock = isPwa && (isIOS || isAndroid);

    // Actualizar el contexto
    setContext({
      isPwa,
      isIOS,
      isAndroid,
      hasHomeIndicator,
      hasNavBar,
      hasNotch,
      appBarHeight,
      navBarHeight,
      needsScrollLock
    });
    
    // Debug
    console.log('Device context:', {
      isPwa,
      isIOS,
      isAndroid,
      hasHomeIndicator,
      hasNavBar,
      hasNotch,
      appBarHeight,
      navBarHeight,
      needsScrollLock,
      windowHeight,
      windowWidth,
      aspectRatio
    });
    
    // Si es PWA, añadimos clases al HTML
    if (isPwa) {
      document.documentElement.classList.add('pwa-html-mode');
      document.body.classList.add('pwa-mode');
      
      if (needsScrollLock) {
        document.documentElement.classList.add('needs-scroll-lock');
      }
    } else {
      document.documentElement.classList.remove('pwa-html-mode');
      document.body.classList.remove('pwa-mode');
      document.documentElement.classList.remove('needs-scroll-lock');
    }
    
  }, []);

  return context;
}