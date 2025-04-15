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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch al volver a la ventana o tab
      staleTime: 30000, // 30 segundos antes de considerar los datos obsoletos
      retry: 1, // Un reintento si la consulta falla
      retryDelay: 1000, // 1 segundo entre reintentos
      refetchOnMount: true, // Refetch cuando el componente se monte
    },
    mutations: {
      retry: 1, // Un reintento si la mutación falla
      retryDelay: 1000, // 1 segundo entre reintentos
    },
  },
});
