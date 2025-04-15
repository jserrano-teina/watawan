import { useEffect } from 'react';

/**
 * Hook para bloquear/desbloquear el scroll del body
 * 
 * @param {boolean} lock - Indica si se debe bloquear (true) o desbloquear (false) el scroll
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    const documentBody = document.body;
    
    if (lock) {
      // Guardamos la posición actual del scroll
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      
      // Añadimos la clase para bloquear el scroll
      documentBody.classList.add('body-scroll-lock');
      
      // Fijamos el body en la posición actual para evitar saltos
      documentBody.style.top = `-${scrollPosition}px`;
    } else {
      // Capturamos la posición antes de desbloquear
      const scrollPosition = parseInt((documentBody.style.top || '0').replace('-', '').replace('px', ''));
      
      // Eliminamos la clase que bloquea el scroll
      documentBody.classList.remove('body-scroll-lock');
      
      // Restauramos los estilos
      documentBody.style.top = '';
      
      // Devolvemos la ventana a la posición original
      if (scrollPosition) {
        window.scrollTo(0, scrollPosition);
      }
    }
    
    // Limpieza cuando el componente se desmonta
    return () => {
      // Si aún tenemos la clase al desmontar, limpiamos todo
      if (documentBody.classList.contains('body-scroll-lock')) {
        const scrollPosition = parseInt((documentBody.style.top || '0').replace('-', '').replace('px', ''));
        documentBody.classList.remove('body-scroll-lock');
        documentBody.style.top = '';
        
        if (scrollPosition) {
          window.scrollTo(0, scrollPosition);
        }
      }
    };
  }, [lock]);
}

export default useScrollLock;