import { create } from 'zustand';

// Una simple tienda global para coordinar interacciones entre componentes
// y evitar que eventos se disparen accidentalmente

interface InteractionLockState {
  isLocked: boolean;
  lockTimestamp: number;
  lockDuration: number;
  lockInteraction: (duration?: number) => void;
  isInteractionAllowed: () => boolean;
}

// Creamos un store de Zustand para gestionar el estado globalmente
export const useInteractionLock = create<InteractionLockState>((set, get) => ({
  isLocked: false,
  lockTimestamp: 0,
  lockDuration: 1000, // 1 segundo por defecto
  
  // Función para bloquear interacciones durante un tiempo
  lockInteraction: (duration?: number) => {
    const lockTime = Date.now();
    const lockDuration = duration || get().lockDuration;
    
    set({
      isLocked: true,
      lockTimestamp: lockTime,
      lockDuration,
    });
    
    // Programar el desbloqueo automático
    setTimeout(() => {
      // Solo desbloquear si este es el último bloqueo establecido
      if (get().lockTimestamp === lockTime) {
        set({ isLocked: false });
      }
    }, lockDuration);
  },
  
  // Función para comprobar si una interacción está permitida
  isInteractionAllowed: () => {
    const { isLocked, lockTimestamp, lockDuration } = get();
    
    // Si no está bloqueado, permitir la interacción
    if (!isLocked) return true;
    
    // Comprobar si el tiempo de bloqueo ha pasado
    const now = Date.now();
    const elapsedTime = now - lockTimestamp;
    
    return elapsedTime > lockDuration;
  },
}));