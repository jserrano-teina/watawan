/**
 * Configuración de rate limiting para proteger la API
 */

import rateLimit from 'express-rate-limit';

// Rate limiting general para la API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para extracción de metadatos
export const metadataLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 extracciones por ventana
  message: {
    error: 'Demasiadas solicitudes de extracción de metadatos. Intenta de nuevo en 5 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por ventana
  message: {
    error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // no contar requests exitosos
});

// Rate limiting para subida de imágenes
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 uploads por minuto
  message: {
    error: 'Demasiadas subidas de imagen. Intenta de nuevo en 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});