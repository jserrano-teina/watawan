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

// Para asegurar CORS y CSRFToken se incluyen en las peticiones de verificación
import { updateTokenFromResponse, addTokenToHeaders } from './csrfManager';

// Intervalo de ping cuando el usuario está activo (2 minutos)
const ACTIVE_PING_INTERVAL = 2 * 60 * 1000;

// Intervalo más corto para verificar actualizaciones (10 segundos)
const RISK_PING_INTERVAL = 10 * 1000;

// Intervalo ultrarrápido para verificar notificaciones nuevas (5 segundos)
const NOTIFICATION_CHECK_INTERVAL = 5 * 1000;

// Estado del gestor de sesión
interface SessionState {
  isActive: boolean;
  lastPingTime: number;
  pingIntervalId: number | null;
  notificationCheckIntervalId: number | null;
  lastNotificationCount: number;
  sessionKey: string | null;
}

// Estado inicial
const state: SessionState = {
  isActive: false,
  lastPingTime: 0,
  pingIntervalId: null,
  notificationCheckIntervalId: null,
  lastNotificationCount: 0,
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
 * Sistema de verificación de actualizaciones en tiempo real
 * Permite detectar cambios como nuevas reservas o marcados como recibidos
 * y actualizar la interfaz inmediatamente sin necesidad de refrescar
 */
const checkForUpdates = async (): Promise<boolean> => {
  try {
    console.log('Verificando actualizaciones en tiempo real...');
    
    // 1. Verificar notificaciones no leídas (nuevas reservas)
    // Incluir token CSRF para evitar problemas de autorización
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store'
    };
    
    // Añadir token CSRF para evitar problemas de autorización
    addTokenToHeaders(headers);
    
    const unreadResponse = await fetch('/api/notifications/unread', {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    // Actualizar el token CSRF para futuras peticiones
    updateTokenFromResponse(unreadResponse);
    
    if (unreadResponse.ok) {
      const unreadData = await unreadResponse.json();
      
      if (Array.isArray(unreadData) && unreadData.length > 0) {
        console.log(`Se encontraron ${unreadData.length} notificaciones nuevas - actualizando todas las vistas`);
        
        // Invalidar TODAS las consultas relacionadas para forzar actualización en todas las vistas
        queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
        queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
        
        // También invalidar los endpoints de items
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
            return typeof queryKey === 'string' && queryKey.includes('/items');
          }
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando actualizaciones:', error);
    return false;
  }
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
  
  // Inicializar contador de notificaciones en 0
  state.lastNotificationCount = 0;
  
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
  
  // Configurar verificador de notificaciones (mucho más frecuente)
  if (state.notificationCheckIntervalId) {
    window.clearInterval(state.notificationCheckIntervalId);
  }
  
  // Ejecutar verificación inicial de notificaciones
  startNotificationChecker();
  
  // Configurar verificación periódica de notificaciones cada 5 segundos
  state.notificationCheckIntervalId = window.setInterval(() => {
    // Solo verificar si la pestaña está visible y hay conexión
    if (document.visibilityState === 'visible' && navigator.onLine) {
      startNotificationChecker();
    }
  }, NOTIFICATION_CHECK_INTERVAL);
  
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
 * Verifica periódicamente solo las notificaciones para actualizaciones en tiempo real
 * Optimizado para detección inmediata de reservas
 */
const startNotificationChecker = async (): Promise<void> => {
  if (!navigator.onLine || !state.isActive) {
    return;
  }

  try {
    // Solo verificar notificaciones no leídas (que indican reservas nuevas)
    // Incluir token CSRF para evitar problemas de autorización
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store'
    };
    
    // Añadir token CSRF para evitar problemas de autorización
    addTokenToHeaders(headers);
    
    const unreadResponse = await fetch('/api/notifications/unread', {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    // Actualizar el token CSRF para futuras peticiones
    updateTokenFromResponse(unreadResponse);
    
    if (unreadResponse.ok) {
      const unreadData = await unreadResponse.json();
      const currentCount = Array.isArray(unreadData) ? unreadData.length : 0;
      
      // Si el número de notificaciones cambió, actualizar la interfaz
      if (currentCount !== state.lastNotificationCount) {
        console.log(`Cambio en notificaciones detectado: ${state.lastNotificationCount} → ${currentCount}`);
        
        if (currentCount > state.lastNotificationCount) {
          console.log('Nuevas notificaciones detectadas - actualizando inmediatamente todas las vistas');
          
          // Actualización inmediata y agresiva de TODAS las vistas relacionadas
          queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
          queryClient.invalidateQueries({ queryKey: [`/api/notifications/unread`] });
          queryClient.invalidateQueries({ queryKey: [`/api/reserved-items`] });
          
          // Actualizar vistas de elementos específicos
          const wishlistQueries = queryClient.getQueriesData({ 
            queryKey: ['/api/wishlist'] 
          });
          
          // Actualizar todas las wishlists encontradas en caché
          wishlistQueries.forEach(([_, data]) => {
            if (data && typeof data === 'object' && 'id' in data) {
              const wlId = (data as any).id;
              if (wlId && typeof wlId === 'number') {
                console.log(`Actualizando items de wishlist ${wlId} por notificación nueva`);
                queryClient.invalidateQueries({ queryKey: [`/api/wishlist/${wlId}/items`] });
              }
            }
          });
        }
        
        // Actualizar el contador para la próxima comparación
        state.lastNotificationCount = currentCount;
      }
    }
  } catch (error) {
    console.error('Error verificando notificaciones:', error);
  }
};

/**
 * Detiene el sistema de gestión de sesión
 */
export const stopSessionManager = (): void => {
  if (state.pingIntervalId) {
    window.clearInterval(state.pingIntervalId);
    state.pingIntervalId = null;
  }
  
  if (state.notificationCheckIntervalId) {
    window.clearInterval(state.notificationCheckIntervalId);
    state.notificationCheckIntervalId = null;
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