# 🚀 Test WataWan Nativo - Guía Rápida

## Para Android (Más Fácil)

**Requisitos:**
- Dispositivo Android con cable USB
- Activar "Opciones de desarrollador" → "Depuración USB"

**Pasos:**
1. `cd mobile-client && npm run open:android`
2. En Android Studio → Conectar dispositivo → Run ▶️
3. App se instala automáticamente

**Probar sharing:**
- Abre Chrome → Busca producto Amazon
- Share → Selecciona "WataWan" 
- App abre con URL pre-rellenada

## Para iOS (Requiere Mac)

**Requisitos:**
- Mac con Xcode
- iPhone/iPad con cable
- Apple ID gratuita

**Pasos:**
1. `cd mobile-client && npm run open:ios`
2. En Xcode → Seleccionar dispositivo → Run ▶️
3. En iPhone: Confiar en desarrollador

**Probar sharing:**
- Abre Safari → Encuentra producto
- Share → Selecciona "WataWan"
- App abre instantáneamente

## Funciones a Probar

✅ **Sharing hacia WataWan:**
- Desde cualquier app → Share → WataWan aparece
- URL se captura y pre-rellena automáticamente

✅ **Sharing desde WataWan:**
- Dentro de la app → Share producto
- Aparecen opciones nativas del sistema

✅ **Performance nativo:**
- Navegación más fluida que web
- Animaciones suaves
- Carga instantánea

## Estado Actual: LISTO PARA TESTING

Las apps están completamente funcionales con sharing nativo implementado.