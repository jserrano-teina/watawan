/**
 * Módulo centralizado de validación y sanitización
 * Proporciona validadores reutilizables para endpoints de la API
 */

import { body, param, query, ValidationChain } from 'express-validator';

// Validadores para URLs
export const validateUrl = (): ValidationChain => 
  body('url')
    .notEmpty()
    .withMessage('URL es requerida')
    .isURL({ 
      protocols: ['http', 'https'],
      require_protocol: true 
    })
    .withMessage('Debe ser una URL válida')
    .isLength({ max: 2048 })
    .withMessage('URL demasiado larga')
    .customSanitizer((value: string) => {
      // Sanitizar URL removiendo caracteres peligrosos
      return value.trim().replace(/[<>'"]/g, '');
    });

// Validadores para metadatos de productos
export const validateProductMetadata = (): ValidationChain[] => [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título debe tener entre 1 y 200 caracteres')
    .trim()
    .escape(),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descripción no puede exceder 1000 caracteres')
    .trim()
    .escape(),
    
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio debe ser un número positivo'),
    
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('URL de imagen debe ser válida')
    .isLength({ max: 2048 })
    .withMessage('URL de imagen demasiado larga')
];

// Validador para IDs numéricos
export const validateNumericId = (field: string = 'id'): ValidationChain =>
  param(field)
    .isInt({ min: 1 })
    .withMessage(`${field} debe ser un número entero positivo`)
    .toInt();

// Validador para datos de wishlist
export const validateWishlistData = (): ValidationChain[] => [
  body('name')
    .notEmpty()
    .withMessage('Nombre de lista es requerido')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre debe tener entre 1 y 100 caracteres')
    .trim()
    .escape()
];

// Validador para items de wishlist
export const validateWishlistItem = (): ValidationChain[] => [
  body('title')
    .notEmpty()
    .withMessage('Título es requerido')
    .isLength({ min: 1, max: 200 })
    .withMessage('Título debe tener entre 1 y 200 caracteres')
    .trim()
    .escape(),
    
  body('purchaseLink')
    .optional()
    .isURL()
    .withMessage('Enlace de compra debe ser una URL válida')
    .isLength({ max: 2048 })
    .withMessage('Enlace de compra demasiado largo'),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descripción no puede exceder 1000 caracteres')
    .trim()
    .escape(),
    
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio debe ser un número positivo'),
    
  body('currency')
    .optional()
    .isIn(['€', '$', '£', 'USD', 'EUR', 'GBP'])
    .withMessage('Moneda no válida'),
    
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('URL de imagen debe ser válida')
    .isLength({ max: 2048 })
    .withMessage('URL de imagen demasiado larga')
];

// Validador para datos de usuario
export const validateUserProfile = (): ValidationChain[] => [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nombre debe tener entre 1 y 50 caracteres')
    .trim()
    .escape(),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail()
];

// Validador para queries de extracción de metadatos
export const validateMetadataQuery = (): ValidationChain =>
  query('url')
    .notEmpty()
    .withMessage('URL es requerida')
    .isURL({ 
      protocols: ['http', 'https'],
      require_protocol: true 
    })
    .withMessage('Debe ser una URL válida')
    .isLength({ max: 2048 })
    .withMessage('URL demasiado larga')
    .customSanitizer((value: string) => {
      return value.trim().replace(/[<>'"]/g, '');
    });