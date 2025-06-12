# WataWan React Native Migration Guide

Esta guía detalla cómo migrar WataWan de una PWA web a una aplicación móvil nativa usando React Native + Expo, manteniendo el backend Express + PostgreSQL existente.

## 📋 Arquitectura Recomendada

```
watawan-ecosystem/
├── watawan-web/          # Proyecto web actual (React + Vite)
├── watawan-mobile/       # Nueva app React Native + Expo
└── watawan-backend/      # Backend compartido (Express + PostgreSQL)
```

## 🚀 Paso 1: Configuración del Proyecto React Native

### Crear el proyecto Expo
```bash
npx create-expo-app@latest watawan-mobile --template blank-typescript
cd watawan-mobile
```

### Instalar dependencias clave
```bash
npx expo install expo-router expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
npx expo install expo-image expo-clipboard expo-sharing
npx expo install expo-notifications expo-constants expo-linking
npx expo install @tanstack/react-query zustand
npx expo install react-native-reanimated react-native-gesture-handler
```

## 🔧 Paso 2: Configuración Base

### app.json
```json
{
  "expo": {
    "name": "WataWan",
    "slug": "watawan-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "splash": {
      "backgroundColor": "#121212"
    },
    "ios": {
      "bundleIdentifier": "com.watawan.app"
    },
    "android": {
      "package": "com.watawan.app"
    },
    "web": {
      "bundler": "metro"
    },
    "scheme": "watawan",
    "plugins": ["expo-router"]
  }
}
```

## 📱 Paso 3: Estructura de Navegación con Expo Router

### app/_layout.tsx
```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ 
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#fff' 
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ title: 'Iniciar sesión' }} />
      </Stack>
      <StatusBar style="light" backgroundColor="#121212" />
    </QueryClientProvider>
  );
}
```

### app/(tabs)/_layout.tsx
```tsx
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#FFE066',
      tabBarStyle: { backgroundColor: '#121212' }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Mis Listas',
          tabBarIcon: ({ color }) => 
            <MaterialIcons name="list" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="reserved" 
        options={{
          title: 'Reservados',
          tabBarIcon: ({ color }) => 
            <MaterialIcons name="bookmark" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
```

## 🔄 Paso 4: Migración de Componentes

### Hook de autenticación (lib/useAuth.ts)
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from './api';

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('/api/user'),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials) => 
      apiRequest('/api/login', { method: 'POST', body: credentials }),
  });

  return { user, isLoading, loginMutation };
}
```

### Cliente API (lib/api.ts)
```tsx
const API_BASE_URL = 'https://app.watawan.com'; // Tu dominio backend

export async function apiRequest(endpoint: string, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) throw new Error('API Error');
  return response.json();
}
```

## 🎨 Paso 5: Componentes UI Nativos

### Componente de lista de deseos
```tsx
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export function WishlistCard({ wishlist }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{wishlist.name}</Text>
      <ScrollView horizontal>
        {wishlist.items.map(item => (
          <View key={item.id} style={styles.item}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <Text style={styles.itemTitle}>{item.title}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    margin: 8,
    borderRadius: 12,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // ... más estilos
});
```

## 📱 Paso 6: Funcionalidades Nativas

### Compartir nativo
```tsx
import { Share } from 'react-native';

export async function shareWishlist(wishlist) {
  await Share.share({
    message: `Mira mi lista de deseos: https://watawan.com/user/${wishlist.username}`,
    url: `https://watawan.com/user/${wishlist.username}`,
  });
}
```

### Notificaciones push
```tsx
import * as Notifications from 'expo-notifications';

export async function setupNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') {
    const token = await Notifications.getExpoPushTokenAsync();
    // Enviar token al backend
  }
}
```

## 🌐 Paso 7: Exportación Web

### Metro config para web
```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;
```

## 🚀 Paso 8: Deployment

### Build para stores
```bash
# iOS
eas build --platform ios

# Android  
eas build --platform android

# Web
npx expo export --platform web
```

## 📋 Checklist de Migración

### Backend (sin cambios)
- ✅ Express server funciona igual
- ✅ PostgreSQL database sin modificaciones  
- ✅ APIs REST mantienen mismo formato
- ✅ Autenticación por sesión compatible

### Frontend React Native
- 🔄 Configurar navegación con Expo Router
- 🔄 Migrar hooks de autenticación y estado
- 🔄 Recrear componentes UI con React Native
- 🔄 Implementar funcionalidades nativas
- 🔄 Configurar notificaciones push
- 🔄 Setup de builds para stores

### Funcionalidades Específicas WataWan
- 🔄 Lista de deseos con imágenes y URLs
- 🔄 Sistema de reservas en tiempo real
- 🔄 Compartir listas vía enlaces
- 🔄 Extracción de metadatos de URLs
- 🔄 Gestión de perfil de usuario
- 🔄 Notificaciones de reservas

## 💡 Ventajas de Esta Migración

1. **Rendimiento nativo** superior a PWA
2. **Funcionalidades móviles** completas (notificaciones, cámara, compartir)
3. **Distribución en stores** oficiales
4. **Backend reutilizado** al 100%
5. **Experiencia de usuario** optimizada para móvil
6. **Mantenimiento simplificado** con código compartido

## ⚡ Próximos Pasos

1. Crear nuevo proyecto Expo independiente
2. Configurar navegación y estructura base
3. Migrar pantallas principales (auth, wishlist, profile)
4. Implementar funcionalidades nativas
5. Testing en dispositivos físicos
6. Preparar builds para App Store y Google Play

¿Quieres que empecemos con algún paso específico?