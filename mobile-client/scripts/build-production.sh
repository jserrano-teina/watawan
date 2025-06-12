#!/bin/bash

# Script de build para producción - WataWan Mobile
set -e

echo "🚀 Building WataWan for production deployment..."

# Limpiar builds anteriores
echo "📁 Cleaning previous builds..."
rm -rf dist/
rm -rf android/app/src/main/assets/public/
rm -rf ios/App/App/public/

# Build optimizado para producción
echo "⚡ Building optimized web assets..."
npm run build

# Sincronizar con proyectos nativos
echo "📱 Syncing with native projects..."
npx cap sync

# Verificar que los assets se copiaron correctamente
echo "✅ Verifying Android assets..."
if [ -d "android/app/src/main/assets/public" ]; then
    echo "   Android assets: OK"
else
    echo "   ❌ Android assets: FAILED"
    exit 1
fi

echo "✅ Verifying iOS assets..."
if [ -d "ios/App/App/public" ]; then
    echo "   iOS assets: OK"
else
    echo "   ❌ iOS assets: FAILED"
    exit 1
fi

echo ""
echo "🎉 Production build completed successfully!"
echo ""
echo "Next steps:"
echo "📱 Android: npx cap open android"
echo "🍎 iOS: npx cap open ios"
echo ""
echo "Store deployment commands:"
echo "🏪 Android: Build → Generate Signed Bundle/APK in Android Studio"
echo "🏪 iOS: Product → Archive → Distribute App in Xcode"