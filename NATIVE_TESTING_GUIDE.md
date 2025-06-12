# 📱 WataWan - Guía de Testing Nativo

## 🎯 Apps Nativas Listas para Testing

Las aplicaciones Android e iOS están completamente configuradas con funcionalidad de sharing nativo.

## 🤖 Testing en Android

### Opción 1: Dispositivo Android Real (Recomendado)

**Preparación:**
1. Activa "Opciones de desarrollador" en tu Android
2. Habilita "Depuración USB" 
3. Conecta el dispositivo por USB
4. Acepta la conexión de depuración

**Testing:**
```bash
cd mobile-client
npm run open:android
```

En Android Studio:
1. Espera a que cargue el proyecto
2. Selecciona tu dispositivo en el dropdown
3. Click en el botón ▶️ (Run)
4. La app se instala y abre automáticamente

**Probar Sharing:**
1. Abre Instagram/Chrome/cualquier app
2. Encuentra un producto (ej: enlace de Amazon)
3. Toca "Compartir" → Verás "WataWan" en la lista
4. Selecciona WataWan → La app se abre con el enlace

### Opción 2: Emulador Android

**En Android Studio:**
1. Tools → AVD Manager
2. Create Virtual Device
3. Selecciona un dispositivo (ej: Pixel 6)
4. Descarga una imagen del sistema (API 33+)
5. Finish → Start el emulador
6. Run la app desde Android Studio

## 🍎 Testing en iOS

### Opción 1: Dispositivo iOS Real (Recomendado)

**Preparación:**
1. Conecta iPhone/iPad por USB
2. Confía en tu computadora desde iOS
3. Necesitas una Apple ID (gratuita para testing)

**Testing:**
```bash
cd mobile-client
npm run open:ios
```

En Xcode:
1. Espera a que cargue el proyecto
2. Selecciona tu dispositivo iOS
3. En "Signing & Capabilities" → Team: Tu Apple ID
4. Click ▶️ (Run)
5. En iOS: Settings → General → Device Management → Trust Developer

**Probar Sharing:**
1. Abre Safari/Instagram/cualquier app
2. Encuentra un producto
3. Toca Share → Verás "WataWan" 
4. Selecciona WataWan → La app se abre

### Opción 2: Simulador iOS

**En Xcode:**
1. Product → Destination → iOS Simulator
2. Selecciona iPhone 15 Pro (o similar)
3. Run la app

## 🔗 Testing de Funcionalidad de Sharing

### Casos de Prueba Principales:

**1. Compartir desde Chrome/Safari:**
- Busca producto en Amazon
- Share → WataWan
- Verifica que se abre /add-item con URL pre-rellenada

**2. Compartir desde Instagram:**
- Ve a un post con enlace de producto
- Share → WataWan  
- Confirma que el enlace se captura

**3. Compartir desde app de email:**
- Recibe email con enlace de producto
- Long press → Share → WataWan
- Verifica apertura correcta

**4. Compartir hacia afuera:**
- Dentro de WataWan, ve a un producto
- Toca Share
- Confirma que aparecen opciones del sistema

## 🐛 Troubleshooting Común

**Android:**
- Si no aparece WataWan en share menu → Reinstala la app
- Si crash al abrir → Revisa logs en Android Studio
- Si no se conecta el dispositivo → Revisa drivers USB

**iOS:**
- Si error de signing → Cambia Bundle ID en Xcode
- Si no aparece en share menu → Revisa Info.plist
- Si crash → Revisa logs en Xcode Console

## ⚡ Comandos Rápidos

```bash
# Build y abrir Android
cd mobile-client
npm run deploy:android

# Build y abrir iOS  
cd mobile-client
npm run deploy:ios

# Solo sync cambios
npx cap sync

# Ver logs en tiempo real
npx cap run android --livereload
npx cap run ios --livereload
```

## 📊 Testing Checklist

**Funcionalidad Core:**
- [ ] Login/registro funciona
- [ ] Crear wishlist
- [ ] Añadir productos por URL
- [ ] Añadir productos por sharing desde otras apps
- [ ] Ver lista de productos
- [ ] Marcar como reservado/recibido
- [ ] Compartir wishlist hacia otras apps

**UI/UX:**
- [ ] Interfaz responsive en móvil
- [ ] Navegación fluida
- [ ] Botones táctiles apropiados
- [ ] Notificaciones se muestran
- [ ] Carga rápida de imágenes

**Sharing Nativo:**
- [ ] WataWan aparece en menú compartir sistema
- [ ] URLs se capturan correctamente
- [ ] App se abre en página correcta
- [ ] Sharing hacia afuera funciona

## 🎯 Próximos Pasos Después del Testing

Una vez confirmes que todo funciona:

1. **Optimizaciones finales** basadas en tu feedback
2. **Preparación para stores** (iconos, screenshots, descripciones)
3. **Deploy a Google Play Store** (testing interno → producción)
4. **Deploy a Apple App Store** (TestFlight → App Store)

## 💡 Notas Importantes

- Las apps usan el mismo backend que la web
- Los datos se sincronizan entre web y móvil
- El sharing funciona bidireccional (recibir y enviar)
- Performance nativo superior a PWA
- Preparado para notificaciones push (futuro)