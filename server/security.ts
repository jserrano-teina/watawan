/**
 * Módulo de seguridad centralizado para WataWan
 * Implementa protecciones contra vulnerabilidades comunes
 */

import { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * Configura las medidas de seguridad básicas para la aplicación
 */
export function setupSecurity(app: Express) {
  // Determinar si estamos en entorno de desarrollo
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Implementar headers de seguridad básicos manualmente (sin helmet)
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevenir sniffing de MIME types
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Activar protección XSS del navegador
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Solo en producción, agregar headers más estrictos
    if (!isDevelopment) {
      // Forzar HTTPS en producción
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Política de referrer más estricta
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    
    next();
  });

  // Solo aplicar rate limiting en producción para evitar interferir con el desarrollo
  if (!isDevelopment) {
    // Rate limiting general
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Límite de requests por IP
      message: {
        error: "Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos."
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Rate limiting estricto para autenticación
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // Solo 5 intentos de login por IP
      message: {
        error: "Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos."
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Rate limiting para endpoints públicos
    const publicLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 50, // Límite más generoso para endpoints públicos
      message: {
        error: "Demasiadas solicitudes a endpoints públicos, intenta de nuevo en 5 minutos."
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Aplicar rate limiting general
    app.use('/api/', generalLimiter);
    
    // Aplicar rate limiting específico para autenticación
    app.use('/api/login', authLimiter);
    app.use('/api/register', authLimiter);
    
    // Aplicar rate limiting para endpoints públicos de listas compartidas
    app.use('/api/user/', publicLimiter);
  }
}

/**
 * Middleware para validar y sanitizar datos de entrada
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Función helper para sanitizar strings
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    // Eliminar caracteres potencialmente peligrosos
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Eliminar tags script
      .replace(/javascript:/gi, '') // Eliminar javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Eliminar event handlers
      .trim();
  };

  // Sanitizar campos específicos en el body
  if (req.body) {
    if (req.body.title) {
      req.body.title = sanitizeString(req.body.title);
    }
    if (req.body.description) {
      req.body.description = sanitizeString(req.body.description);
    }
    if (req.body.reserverName) {
      req.body.reserverName = sanitizeString(req.body.reserverName);
    }
    if (req.body.displayName) {
      req.body.displayName = sanitizeString(req.body.displayName);
    }
  }

  next();
}

/**
 * Middleware para logging de seguridad
 */
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  // Log de intentos de acceso sospechosos
  const suspiciousPatterns = [
    /\.\.\//,              // Path traversal
    /SELECT.*FROM/i,       // SQL injection attempt
    /<script/i,            // XSS attempt
    /javascript:/i,        // JavaScript URL attempt
    /eval\(/i,             // Code injection attempt
  ];

  const url = req.url;
  const userAgent = req.headers['user-agent'] || '';
  const body = JSON.stringify(req.body || {});
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent) || pattern.test(body)
  );

  if (isSuspicious) {
    console.warn(`[SECURITY] Solicitud sospechosa detectada:`, {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }

  next();
}