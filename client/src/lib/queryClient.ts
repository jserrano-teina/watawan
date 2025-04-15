import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { sanitizeObject } from './sanitize';
import { updateTokenFromResponse, addTokenToHeaders } from './csrfManager';

/**
 * Comprueba si la respuesta HTTP es correcta, en caso contrario extrae el mensaje de error
 * y lo lanza como una excepción.
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      // Intentamos parsear la respuesta como JSON primero
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      // Si no es JSON, usamos el texto plano
      const text = await res.text();
      errorMessage = text || res.statusText;
    }
    
    console.error(`Error HTTP ${res.status}: ${errorMessage}`);
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

/**
 * Función para realizar solicitudes a la API con manejo de errores mejorado.
 * Utiliza credenciales automáticamente e incluye headers adecuados.
 */

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`Realizando ${method} a ${url}${data ? ' con datos' : ''}`);
    
    // Sanitizar datos antes de enviarlos si es un objeto
    let sanitizedData = data;
    if (data && typeof data === 'object') {
      sanitizedData = sanitizeObject(data as Record<string, any>);
    }
    
    // Crear headers base y añadir el token CSRF para métodos no seguros
    let headers: Record<string, string> = {};
    
    if (data) {
      headers = { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
    }
    
    // Añadir token CSRF para métodos no seguros (POST, PUT, DELETE, etc.)
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      headers = addTokenToHeaders(headers);
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: sanitizedData ? JSON.stringify(sanitizedData) : undefined,
      credentials: "include",
    });
    
    // Actualizar el token CSRF si está presente en la respuesta
    updateTokenFromResponse(res.headers);

    await throwIfResNotOk(res);
    console.log(`Éxito en ${method} a ${url}`);
    return res;
  } catch (error) {
    console.error(`Error en solicitud ${method} a ${url}:`, error);
    throw error; // Re-lanzamos el error para que lo maneje React Query
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Determinar la URL a partir de la queryKey
    let url: string;
    const key = queryKey[0];
    
    if (typeof key === 'string') {
      url = key;
    } else {
      console.error('QueryKey debe ser un string', queryKey);
      throw new Error('QueryKey inválida: debe ser un string');
    }
    
    // Realizar la solicitud
    console.log(`Realizando petición a: ${url}`);
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    
    // Actualizar el token CSRF si está presente en la respuesta
    updateTokenFromResponse(res.headers);

    // Manejar respuesta 401 (no autorizado)
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Respuesta 401: No autorizado, devolviendo null');
      return null;
    }

    // Lanzar error si la respuesta no está OK
    await throwIfResNotOk(res);
    
    // Devolver JSON
    return await res.json();
  };

// Utilidad para invalidar todas las consultas relacionadas con los datos de la aplicación
export function invalidateAllAppQueries(wishlistId?: number) {
  console.log('Invalidando todas las consultas de la aplicación');
  
  // Invalidar consultas específicas
  queryClient.invalidateQueries({ queryKey: ['/api/reserved-items'] });
  queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
  queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  
  // Invalidar la wishlist completa
  queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
  
  // Si tenemos un ID específico, invalidamos los items de esa wishlist
  if (wishlistId) {
    console.log(`Invalidando específicamente los items del wishlist ${wishlistId}`);
    queryClient.invalidateQueries({ queryKey: [`/api/wishlist/${wishlistId}/items`] });
  }
  
  // Estrategia agresiva para invalidar absolutamente todas las consultas relacionadas
  queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
      return typeof queryKey === 'string' && (
        queryKey.includes('/api/wishlist') || 
        queryKey.includes('/api/reserved-items') ||
        queryKey.includes('/api/notifications')
      );
    }
  });
  
  console.log('Invalidación completa realizada');
}

/**
 * Detecta si la aplicación está desconectada de la red
 */
function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Cliente de consulta configurado para la aplicación con manejo de desconexión mejorado.
 * Proporciona mejor manejo de errores, reintentos y estado de sesión para evitar cierres inesperados.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch al volver a la ventana o tab
      staleTime: 1000 * 60 * 5, // 5 minutos antes de considerar los datos obsoletos
      gcTime: 1000 * 60 * 30, // 30 minutos de caché de datos aunque sean stale (antes cacheTime)
      retry: (failureCount, error) => {
        // No reintentar si estamos desconectados
        if (isOffline()) return false;
        
        // Reintentar un máximo de 3 veces para problemas de red
        if (failureCount >= 3) return false;
        
        // No reintentar si es un error 403 (problemas de autorización)
        if (error instanceof Error) {
          const errorMessage = error.message || '';
          if (errorMessage.startsWith('403:')) {
            return false;
          }
          
          // Para errores 401, intentar solo una vez más para verificar si realmente expiró la sesión
          if (errorMessage.startsWith('401:') && failureCount >= 1) {
            return false;
          }
        }
        
        return true;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
      refetchOnMount: true, // Refetch cuando el componente se monte
      refetchOnReconnect: true, // Refetch cuando se recupere la conexión a Internet
    },
    mutations: {
      retry: (failureCount, error) => {
        // No reintentar si estamos desconectados
        if (isOffline()) return false;
        
        // Solo reintentar una vez para mutaciones
        if (failureCount >= 1) return false;
        
        // No reintentar errores de autenticación
        if (error instanceof Error) {
          const errorMessage = error.message || '';
          if (errorMessage.startsWith('401:') || errorMessage.startsWith('403:')) {
            return false;
          }
        }
        
        return true;
      },
      retryDelay: 1000, // 1 segundo entre reintentos
    },
  },
});
