import { NextFunction, Request, Response } from "express";
import Tokens from "csrf";

// Crear una instancia de Tokens para generar y verificar tokens CSRF
const tokens = new Tokens();

// Nombre de la cookie que almacenará el secreto
const SECRET_COOKIE_NAME = "csrf_secret";
// Nombre del header que se usará para enviar el token
export const CSRF_HEADER = "X-CSRF-Token";
// Duración del secreto (1 día en milisegundos)
const SECRET_LIFETIME = 24 * 60 * 60 * 1000; // 24 horas

// Middleware para generar y proporcionar secreto CSRF
export function setupCsrf(req: Request, res: Response, next: NextFunction) {
  // Verificar si ya existe un secreto CSRF en las cookies
  let secret = req.cookies?.[SECRET_COOKIE_NAME];
  
  // Si no hay secreto o está cerca de expirar, generar uno nuevo
  if (!secret) {
    // Generar un nuevo secreto
    secret = tokens.secretSync();
    
    // Guardar el secreto en una cookie httpOnly
    res.cookie(SECRET_COOKIE_NAME, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SECRET_LIFETIME,
      sameSite: 'lax',
      path: '/'
    });
  }
  
  // Almacenar el secreto en la solicitud para usarlo en otros middlewares
  req.csrfSecret = secret;
  
  // Generar un token basado en este secreto
  const token = tokens.create(secret);
  
  // Exponer el token CSRF al cliente a través de un header
  res.setHeader("X-CSRF-Token", token);
  
  next();
}

// Middleware para verificar el token CSRF en solicitudes que modifican datos
export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  // Saltarse la verificación para métodos seguros como GET y HEAD
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Obtener el token del header
  const token = req.headers[CSRF_HEADER.toLowerCase()] as string;
  
  // Obtener el secreto de la cookie
  const secret = req.cookies?.[SECRET_COOKIE_NAME];
  
  // Si no hay token o secreto, rechazar la solicitud
  if (!token || !secret) {
    return res.status(403).json({ 
      message: "CSRF token missing or invalid",
      errorCode: "CSRF_ERROR"
    });
  }
  
  // Verificar que el token es válido para este secreto
  if (!tokens.verify(secret, token)) {
    return res.status(403).json({ 
      message: "CSRF token validation failed",
      errorCode: "CSRF_ERROR"
    });
  }
  
  // Si todo está bien, continuar
  next();
}

// Extender la interfaz Request de Express para incluir la propiedad csrfSecret
declare global {
  namespace Express {
    interface Request {
      csrfSecret?: string;
    }
  }
}