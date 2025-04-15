/**
 * Sistema de gestión de sesiones para la aplicación
 * 
 * Características:
 * - Mantiene la sesión activa a través de pings periódicos
 * - Detecta y maneja desconexiones de red
 * - Coordina reconexiones automáticas
 * - Proporciona mecanismos para persistencia local temporal
 */

import { queryClient } from "./queryClient";

// Intervalo de ping cuando el usuario está activo (5 minutos)
const ACTIVE_PING_INTERVAL = 5 * 60 * 1000;

// Intervalo más corto cuando detectamos señales de inactividad (1 minuto)
const RISK_PING_INTERVAL = 60 * 1000;

// Estado del gestor de sesión
interface SessionState {
  isActive: boolean;
  lastPingTime: number;
  pingIntervalId: number | null;
  sessionKey: string | null;
}

// Estado inicial
const state: SessionState = {
  isActive: false,
  lastPingTime: 0,
  pingIntervalId: null,
  sessionKey: null,
};

/**
 * Genera un identificador de sesión local para el seguimiento
 */
const generateSessionKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Recupera el identificador de sesión del almacenamiento local
 */
const getStoredSessionKey = (): string | null => {
  return localStorage.getItem('session_tracking_key');
};

/**
 * Almacena el identificador de sesión en el almacenamiento local
 */
const storeSessionKey = (key: string): void => {
  localStorage.setItem('session_tracking_key', key);
};

/**
 * Envía un ping al servidor para mantener activa la sesión
 * y recuperar el estado en caso de reconexión
 */
const sendPing = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('No hay conexión a Internet, ping pospuesto');
    return;
  }

  try {
    state.lastPingTime = Date.now();
    
    // Solo hacer ping si la sesión está activa o tenemos una clave de sesión
    if (state.isActive || state.sessionKey) {
      console.log('Enviando ping para mantener sesión activa');
      
      const response = await fetch('/api/ping', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
      });
      
      if (response.ok) {
        // Actualizar estado de la sesión
        state.isActive = true;
        
        // Generar clave de sesión si no existe
        if (!state.sessionKey) {
          state.sessionKey = generateSessionKey();
          storeSessionKey(state.sessionKey);
        }
        
        // Refrescar datos si es necesario
        if (document.visibilityState === 'visible') {
          const hasUpdates = await checkForUpdates();
          if (hasUpdates) {
            queryClient.invalidateQueries();
          }
        }
      } else if (response.status === 401) {
        // Sesión expirada o no autenticada
        state.isActive = false;
        console.log('Sesión expirada o no autenticada');
      }
    }
  } catch (error) {
    console.error('Error al enviar ping:', error);
  }
};

/**
 * Verifica si hay actualizaciones desde el último ping
 */
const checkForUpdates = async (): Promise<boolean> => {
  // Implementación básica - podría ampliarse para verificar cambios específicos
  return false;
};

/**
 * Inicia el sistema de gestión de sesión
 */
export const startSessionManager = (): void => {
  // Recuperar clave de sesión almacenada
  const storedKey = getStoredSessionKey();
  if (storedKey) {
    state.sessionKey = storedKey;
    state.isActive = true;
  }
  
  // Configurar ping inicial
  sendPing();
  
  // Configurar intervalo regular de ping
  if (state.pingIntervalId) {
    window.clearInterval(state.pingIntervalId);
  }
  
  state.pingIntervalId = window.setInterval(() => {
    // Determinar el intervalo basado en la visibilidad de la página
    if (document.visibilityState === 'hidden') {
      // Si la página está oculta, hacer ping con menos frecuencia
      const timeSinceLastPing = Date.now() - state.lastPingTime;
      if (timeSinceLastPing < ACTIVE_PING_INTERVAL) {
        return; // Aún no es hora de hacer ping
      }
    }
    
    sendPing();
  }, RISK_PING_INTERVAL);
  
  // Configurar listener para eventos de red
  window.addEventListener('online', () => {
    console.log('Conexión recuperada, enviando ping inmediato');
    sendPing();
  });
  
  // Configurar listener para cambios de visibilidad del documento
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('Tab activada, enviando ping inmediato');
      sendPing();
    }
  });
  
  // Configurar listener para eventos de actividad que indican uso
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'click'];
  const activityHandler = () => {
    if (!state.isActive) {
      console.log('Actividad detectada, enviando ping');
      sendPing();
    }
  };
  
  activityEvents.forEach(event => {
    document.addEventListener(event, activityHandler, { passive: true, once: false });
  });
};

/**
 * Detiene el sistema de gestión de sesión
 */
export const stopSessionManager = (): void => {
  if (state.pingIntervalId) {
    window.clearInterval(state.pingIntervalId);
    state.pingIntervalId = null;
  }
  state.isActive = false;
};

/**
 * Fuerza un ping inmediato al servidor
 */
export const forcePing = (): Promise<void> => {
  return sendPing();
};

/**
 * Comprueba si la sesión está activa
 */
export const isSessionActive = (): boolean => {
  return state.isActive;
};