/**
 * Middleware centralizado para manejo de errores
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Middleware para verificar errores de validación
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  
  next();
};

// Middleware de manejo de errores global
export const globalErrorHandler = (
  error: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error('Error no capturado:', error);
  
  // No revelar detalles internos del error en producción
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: 'Error interno del servidor',
    ...(isDevelopment && { details: error.message, stack: error.stack })
  });
};

// Middleware para rutas no encontradas
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint no encontrado'
  });
};